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

  // const email = `dev_${deviceId}@cardumy.app`;
  const email = `dev@cardumy.app`;
  const password = 'caos1234';

  try {
    // 4. Nova estratégia: Login Anônimo -> Upgrade (Link) para Conta Dev
    // Isso garante que SEMPRE tenhamos uma sessão logo de cara
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

    if (!anonError && anonData.session) {
      const user = anonData.session.user;

      // 5. Tenta linkar com email/senha para tornar a conta permanente
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        email,
        password
      });

      // Se linkou com sucesso ou se o erro for apenas de verificação Pendente
      if (!updateError || updateError.message.includes('check your email')) {
        const finalUser = updateData.user || user;
        await ensureUserProfile(finalUser);
        return anonData.session;
      }

      // 6. Se o erro for "email already registered", significa que a conta de dev já existe.
      // Nesse caso, fazemos o login tradicional para essa conta.
      if (updateError.message.toLowerCase().includes('already registered') || 
          updateError.message.toLowerCase().includes('already exists') ||
          updateError.status === 422) {
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!loginError && loginData.session) {
          await ensureUserProfile(loginData.session.user);
          return loginData.session;
        }
      }

      // Se nada deu certo mas temos a sessão anônima, ficamos com ela por enquanto
      await ensureUserProfile(user);
      return anonData.session;
    }

    // Fallback para login tradicional se anônimo falhar
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!loginError && loginData.session) {
      await ensureUserProfile(loginData.session.user);
      return loginData.session;
    }

    // Se falhar e não tentamos signup ainda
    if (loginError?.code === 'invalid_credentials' && !localStorage.getItem('dev_signup_done')) {
      localStorage.setItem('dev_signup_done', 'true');
      const { data: signData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (!signUpError && signData.session) {
        await ensureUserProfile(signData.session.user);
        return signData.session;
      }
    }

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