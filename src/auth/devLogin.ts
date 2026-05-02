import { supabase } from '../lib/supabase';

export async function devLogin() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log('Sessão dev já existente:', session.user.email);
    return session;
  }

  console.log('Iniciando login automático dev...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'dev@cardumy.app',
    password: '12345678',
  });

  if (error) {
    console.error('Erro login dev:', error);
    return null;
  }

  console.log('Login dev realizado com sucesso:', data.session?.user.email);
  return data.session;
}
