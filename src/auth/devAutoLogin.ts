import { supabase } from '../lib/supabase';

export async function devAutoLogin() {
  // Guard to prevent infinite retry loops in a single session
  if (sessionStorage.getItem('dev_login_attempted')) {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (session) return session;

  // identifica o device
  let deviceId = localStorage.getItem('dev_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('dev_device_id', deviceId);
  }

  const email = `dev_${deviceId}@cardumy.app`;
  const password = '12345678';

  try {
    // 1. tenta login
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // 2. se o erro for explicitamente de credenciais, tenta signup
    if (error && error.message.includes('Invalid login credentials')) {
      console.log('Dev user not found, signing up...', email);
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      
      if (signUpError) {
        console.error('Sign up failed:', signUpError);
        return null;
      }

      // 3. tenta login final após signup
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
      if (retryError) {
        console.error('Retry login failed:', retryError);
        return null;
      }
      
      sessionStorage.setItem('dev_login_attempted', 'true');
      if (retryData.session) await ensureUserProfile(retryData.session.user);
      return retryData.session;
    } 
    
    if (error) {
      console.error('Auth error:', error);
      return null;
    }

    sessionStorage.setItem('dev_login_attempted', 'true');
    if (data.session) await ensureUserProfile(data.session.user);
    return data.session;

  } catch (err) {
    console.error('Unexpected auth system error:', err);
    return null;
  }
}

async function ensureUserProfile(authUser: any) {
  try {
    // 1. Tenta achar pelo auth_id
    let { data: existing, error } = await supabase
      .from('users')
      .select('id, auth_id, email')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    // 2. Se não achar pelo auth_id, tenta pelo email
    if (!existing && !error) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, auth_id, email')
        .eq('email', authUser.email)
        .maybeSingle();
      
      if (byEmail) {
        existing = byEmail;
        // Se achou pelo email mas o auth_id tá errado ou nulo, atualiza
        if (byEmail.auth_id !== authUser.id) {
          await supabase
            .from('users')
            .update({ auth_id: authUser.id })
            .eq('id', byEmail.id);
        }
      }
    }

    if (error) {
      console.error('Error checking user profile:', error);
      return;
    }

    if (!existing) {
      console.log('Profile not found, creating one for authUser:', authUser.id);
      const baseUsername = authUser.email.split('@')[0];
      const username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          username: username,
          codename: username,
          email: authUser.email,
          password: 'provided-by-auth',
          role_id: 7, // Default role
          vip: false
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }
    }
  } catch (err) {
    console.error('Unexpected error in ensureUserProfile:', err);
  }
}
