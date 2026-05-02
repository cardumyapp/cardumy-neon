import { supabase } from '../lib/supabase';

export async function devAutoLogin() {
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
    return retryData.session;
  }
  
  return data.session;
}
