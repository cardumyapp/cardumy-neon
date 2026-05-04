# Guia de Implementação: Copiar e Colar

Para fazer o login funcionar no seu outro aplicativo exatamente como aqui, copie e adapte os trechos abaixo:

## 1. Configuração do Cliente (supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js';

// Use as mesmas chaves do projeto de migração
const supabaseUrl = 'SUA_URL_DO_SUPABASE';
const supabaseAnonKey = 'SUA_ANON_KEY_DO_SUPABASE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Importante para manter o login ao dar F5
    autoRefreshToken: true,
  }
});
```

## 2. Função de Login (Login.jsx)

```javascript
async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Verifica se é um usuário legado que ainda não migrou
    const { data: legacy } = await supabase
      .from('users')
      .select('auth_id')
      .eq('email', email)
      .single();

    if (legacy && !legacy.auth_id) {
       alert("Sua conta ainda não foi ativada. Use a ferramenta de migração.");
    } else {
       alert("Erro de login: " + error.message);
    }
    return;
  }

  console.log("Logado com sucesso!", data.user);
}
```

## 3. Manutenção da Sessão (App.jsx)

Coloque isto no componente principal para garantir que o app "perceba" o usuário logado sempre que abrir:

```javascript
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Checa se já existe uma sessão salva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      {user ? <h1>Bem-vindo, {user.email}</h1> : <LoginForm />}
    </div>
  );
}
```
