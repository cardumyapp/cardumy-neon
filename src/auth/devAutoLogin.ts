import { supabase } from '../lib/supabase';

export async function devAutoLogin() {
  // 1. Check for existing session first
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // 2. Guard to prevent multiple attempts in the same component lifecycle/session if it already failed
  if (sessionStorage.getItem('dev_login_in_progress')) return null;
  
  // 3. Persistent Device ID
  let deviceId = localStorage.getItem('dev_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('dev_device_id', deviceId);
  }

  const email = `dev_${deviceId}@cardumy.app`;
  const password = '12345678';

  sessionStorage.setItem('dev_login_in_progress', 'true');

  try {
    // 4. Try Login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!loginError && loginData.session) {
      await ensureUserProfile(loginData.session.user);
      sessionStorage.removeItem('dev_login_in_progress');
      return loginData.session;
    }

    // 5. If "Invalid login credentials", try Signup
    if (loginError?.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        console.error('Auto-signup failed:', signUpError.message);
        throw signUpError;
      }

      // 6. Final Login attempt after signup
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (retryError) throw retryError;

      if (retryData.session) {
        await ensureUserProfile(retryData.session.user);
        sessionStorage.removeItem('dev_login_in_progress');
        return retryData.session;
      }
    }

    console.error('Auto-login failed after all attempts:', loginError?.message);
    return null;

  } catch (err) {
    console.error('Fatal devAutoLogin error:', err);
    return null;
  } finally {
    sessionStorage.removeItem('dev_login_in_progress');
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
