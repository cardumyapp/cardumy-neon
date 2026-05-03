import { supabase } from '../lib/supabase';

export async function devAutoLogin() {
  // 1. sessão existente
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // 2. trava global (evita loop infinito)
  if (localStorage.getItem('dev_auth_disabled') === 'true') {
    console.warn('Dev auth disabled due to previous failures');
    return null;
  }

  // 3. device persistente
  let deviceId = localStorage.getItem('dev_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('dev_device_id', deviceId);
  }

  const email = `dev_${deviceId}@cardumy.app`;
  const password = '12345678';

  try {
    // 4. tentativa de login
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (!loginError && loginData.session) {
      await ensureUserProfile(loginData.session.user);
      return loginData.session;
    }

    // 5. signup permitido apenas UMA VEZ
    const alreadyTriedSignup = localStorage.getItem('dev_signup_done');

    if (
      loginError?.code === 'invalid_credentials' &&
      !alreadyTriedSignup
    ) {
      localStorage.setItem('dev_signup_done', 'true');

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        console.error('Signup failed:', signUpError);

        // se for rate limit → desativa auth
        if (signUpError.message.includes('rate limit')) {
          localStorage.setItem('dev_auth_disabled', 'true');
        }

        return null;
      }

      // 6. login final (uma única vez)
      const { data: retryData, error: retryError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (retryError) {
        console.error('Retry login failed:', retryError);
        return null;
      }

      if (retryData.session) {
        await ensureUserProfile(retryData.session.user);
        return retryData.session;
      }
    }

    console.error('Login failed:', loginError);
    return null;

  } catch (err) {
    console.error('Fatal devAutoLogin error:', err);
    localStorage.setItem('dev_auth_disabled', 'true');
    return null;
  }
}

async function ensureUserProfile(authUser: any) {
  try {
    // buscar pelo auth_id
    let { data: existing } = await supabase
      .from('users')
      .select('id, auth_id, email')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    // fallback por email
    if (!existing) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, auth_id, email')
        .eq('email', authUser.email)
        .maybeSingle();

      if (byEmail) {
        existing = byEmail;

        if (byEmail.auth_id !== authUser.id) {
          await supabase
            .from('users')
            .update({ auth_id: authUser.id })
            .eq('id', byEmail.id);
        }
      }
    }

    // criar se não existir
    if (!existing) {
      const baseUsername = authUser.email.split('@')[0];
      const username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;

      await supabase.from('users').insert({
        auth_id: authUser.id,
        username,
        codename: username,
        email: authUser.email,
        password: 'provided-by-auth',
        role_id: 7,
        vip: false
      });
    }

  } catch (err) {
    console.error('ensureUserProfile error:', err);
  }
}