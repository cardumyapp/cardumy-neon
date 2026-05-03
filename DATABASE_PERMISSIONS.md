# Permissões do Banco de Dados (Supabase RLS)

Este documento descreve as políticas de acesso necessárias para o funcionamento do Cardumy TCG, garantindo a privacidade dos dados e a integridade das regras de negócio.

## 👥 Usuários Comuns (Authenticated Users)

Estas permissões devem ser aplicadas através de políticas RLS no Supabase, utilizando `auth.uid()` para validar a propriedade dos registros.

### 🧩 Tabelas de Sistema e Metadados (Apenas Leitura)
| Tabela | Permissões | Condição |
| :--- | :--- | :--- |
| `cardgames` | `SELECT` | Público |
| `product_types` | `SELECT` | Público |
| `card_conditions` | `SELECT` | Público |
| `tournament_formats` | `SELECT` | Público |
| `fighter_tags` | `SELECT` | Público |
| `roles` | `SELECT` | Público |
| `shipping_methods` | `SELECT` | Público |
| `payment_methods` | `SELECT` | Público |

### 🃏 Cartas e Produtos
| Tabela | Permissões | Condição |
| :--- | :--- | :--- |
| `cards` | `SELECT`, `INSERT` | Inserção permitida para sincronização de novas cartas da API. |
| `products` | `SELECT` | Público. |
| `store_stock` | `SELECT` | Público (para ver preços e estoque). |

### 📁 Coleção e Social (Proprietário)
| Tabela | Permissões | Condição |
| :--- | :--- | :--- |
| `users` | `SELECT` (Público), `UPDATE` (Próprio) | `uid = auth.uid()` para edição. |
| `user_cards` | `ALL` | `user_id = auth.uid()`. |
| `user_binders` | `ALL` | `user_id = auth.uid()`. |
| `binder_cards` | `ALL` | Via `binder_id` que pertença ao usuário. |
| `wishlist` | `ALL` | `user_id = auth.uid()`. |
| `offerlist` | `ALL` | `user_id = auth.uid()`. |
| `user_decks` | `INSERT`, `UPDATE`, `DELETE` (Próprio), `SELECT` (Público se for public = true) | `user_id = auth.uid()` para modificação. |
| `user_followers` | `INSERT`, `DELETE` (Próprio), `SELECT` (Público) | `follower_id = auth.uid()` para seguir/parar. |
| `user_reviews` | `INSERT` (Próprio), `SELECT` (Público) | `reviewer_id = auth.uid()`. |

### 🛒 Compras e Pedidos
| Tabela | Permissões | Condição |
| :--- | :--- | :--- |
| `orders` | `INSERT`, `SELECT` | `buyer_id = auth.uid()` ou `store_id` associado ao usuário. |
| `order_items` | `INSERT`, `SELECT` | Via `order_id` autorizado. |
| `user_addresses` | `ALL` | `user_id = auth.uid()`. |
| `payments` | `SELECT` | Vinculado a pedidos do usuário. |

### 🏆 Torneios e Eventos
| Tabela | Permissões | Condição |
| :--- | :--- | :--- |
| `tournaments` | `SELECT` (Público), `INSERT`, `UPDATE` (Criador) | `created_by = auth.uid()`. |
| `tournament_entries` | `INSERT`, `SELECT` | Participação em torneios. |
| `tournament_decks` | `INSERT`, `SELECT` | Deck enviado para o torneio. |

---

## 🏪 Lojistas (Merchants)
Usuários com conta de loja habilitada possuem permissões adicionais:

| Tabela | Permissões | Condição |
| :--- | :--- | :--- |
| `stores` | `INSERT`, `UPDATE` | `user_id = auth.uid()`. |
| `store_stock` | `ALL` | Se `store_id` pertencer ao usuário. |
| `products` | `INSERT`, `UPDATE` | Produtos cadastrados pela loja. |
| `merchant_mp_accounts`| `ALL` | `user_id = auth.uid()`. |
| `store_hours` | `ALL` | Se `store_id` pertencer ao usuário. |

---

## 🔐 Regras Importantes de Segurança
1. **NUNCA** permita `DELETE` ou `UPDATE` na tabela `users` onde `auth_id != auth.uid()`.
2. **NUNCA** permita o `INSERT` ou `UPDATE` do campo `role_id` ou `vip` pelo usuário através do cliente. Isso deve ser feito via Edge Functions ou Trigger de Banco.
3. **LOGS:** A tabela `action_logs` deve ser `INSERT ONLY` para o usuário, garantindo auditoria.

---

## 🛠️ Comandos SQL (Supabase Editor)

Copie e execute estes comandos no SQL Editor do seu projeto Supabase para habilitar e configurar as permissões.

### 1. Habilitar RLS em todas as tabelas
```sql
-- Habilitar RLS (exemplo para as principais tabelas)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_binders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Repita para as demais tabelas...
```

### 2. Políticas para Usuários (Perfil e Coleção)
```sql
-- Permitir leitura pública de perfis básicos
CREATE POLICY "Public profiles are viewable by everyone" ON public.users 
  FOR SELECT USING (true);

-- Permitir que usuários editem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = auth_id);

-- Coleção Principal (user_cards)
CREATE POLICY "Users can manage own collection" ON public.user_cards
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Pastas (user_binders)
CREATE POLICY "Users can manage own binders" ON public.user_binders
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Decks
CREATE POLICY "Public decks are viewable by everyone" ON public.user_decks
  FOR SELECT USING (is_public = true OR user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own decks" ON public.user_decks
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));
```

### 3. Políticas para Lojistas (Marketplace)
```sql
-- Gerenciamento de Loja
CREATE POLICY "Users can manage own store" ON public.stores
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Estoque da Loja
CREATE POLICY "Everyone can view stock" ON public.store_stock
  FOR SELECT USING (true);

CREATE POLICY "Store owners can manage stock" ON public.store_stock
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  );
```

### 4. Políticas para Pedidos e Compras
```sql
-- Pedidos (Buyer ou Seller)
CREATE POLICY "Buyers can view own orders" ON public.orders
  FOR SELECT USING (
    buyer_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    store_id IN (SELECT id FROM public.stores WHERE user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  );

CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));
```

### 5. Sincronização de Cartas (API Externa)
```sql
-- Permitir que qualquer usuário autenticado sincronize cartas novas
CREATE POLICY "Authenticated users can insert new cards" ON public.cards
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cards are viewable by everyone" ON public.cards
  FOR SELECT USING (true);
```
