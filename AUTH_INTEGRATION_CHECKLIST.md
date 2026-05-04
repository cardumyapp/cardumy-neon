# Checklist de Integração: Garantindo o Login e Sessão

Se o login funciona mas a sessão "some" ao recarregar, ou se você recebe erros de permissão, siga estes passos no seu **aplicativo principal**:

## 1. Configuração de Variáveis de Ambiente
Certifique-se de que o seu outro app está usando **exatamente o mesmo projeto do Supabase** que esta ferramenta de migração.
*   `VITE_SUPABASE_URL`: Deve ser idêntica em ambos.
*   `VITE_SUPABASE_ANON_KEY`: Deve ser idêntica em ambos.

## 2. Estrutura da Tabela `public.users`
O login no Supabase Auth é separado dos dados do seu banco. Para a sessão funcionar, a tabela `users` no esquema `public` **precisa** ter:
*   **Coluna `auth_id`**: Tipo `UUID`, Unique, referenciando `auth.users(id)`.
*   Se esta coluna estiver vazia ou com o ID errado, o usuário logará no Auth, mas o seu app não conseguirá "achar" quem ele é no banco.

## 3. Row Level Security (RLS) - O Problema #1
Muitas vezes o login acontece, mas o aplicativo não consegue ler os dados do usuário porque o RLS está bloqueando. 
**Execute este SQL no painel do Supabase para garantir acesso:**

```sql
-- 1. Habilitar RLS na tabela
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para o usuário ler seus próprios dados
CREATE POLICY "Permitir leitura do próprio perfil"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- 3. Criar política para o usuário atualizar seus próprios dados
CREATE POLICY "Permitir atualização do próprio perfil"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);
```

## 4. Persistência de Sessão no Frontend
No seu outro app, garanta que o cliente do Supabase está configurado para persistir a sessão localmente:

```typescript
// supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true, // Garante que a sessão sobreviva ao refresh
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
```

## 5. Captura Inicial da Sessão
Ao iniciar o App, você deve verificar se já existe uma sessão ativa antes de renderizar a interface de login:

```typescript
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Usuário já está logado, pule o login
    }
  };
  checkSession();
}, []);
```

## 6. Depuração (Debug)
Se o problema persistir, abra o console do navegador (F12) e verifique:
*   **Application > Local Storage**: Deve haver uma chave `sb-xxxx-auth-token`. Se não existir, a persistência está desativada.
*   **Network Tab**: Verifique se as chamadas para `https://xxx.supabase.co/auth/v1/token` estão retornando status 200.

Utilize esses pontos para validar o código do seu aplicativo principal. O erro mais comum é a falta da política **RLS** ou o campo **auth_id** não estar populado corretamente durante a migração.
