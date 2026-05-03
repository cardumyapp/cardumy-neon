import { supabase } from '../lib/supabase';

export async function devAutoLogin() {
  const { data: { session } } = await supabase.auth.getSession();

  let activeSession = session;

  if (!activeSession) {
    // identifica o device
    let deviceId = localStorage.getItem('dev_device_id');

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('dev_device_id', deviceId);
    }

    const email = `dev_${deviceId}@cardumy.app`;
    const password = '12345678';

    // tenta login
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // se não existir, cria
    if (error) {
      console.log('Dev user not found, signing up...', email);
      await supabase.auth.signUp({
        email,
        password
      });

      const { data: retryData } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      activeSession = retryData.session;
    } else {
      activeSession = data.session;
    }
  }

  if (activeSession) {
    // Garante que o perfil existe na tabela public.users
    await ensureUserProfile(activeSession.user);
  }
  
  return activeSession;
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
