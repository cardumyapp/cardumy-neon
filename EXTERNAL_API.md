# Integração com API Externa (Homura Cards)

Este documento descreve o funcionamento e o propósito da integração com a API externa **Homura Cards**.

## 🎯 Propósito
A API Homura Cards é utilizada **exclusivamente** para a obtenção de metadados e informações sobre cartas de diversos TCGs (Trading Card Games), como Magic: The Gathering, Pokémon e Yu-Gi-Oh!. 

Ela serve como a fonte de verdade para:
- Pesquisa de cartas por nome.
- Obtenção de imagens oficiais.
- Metadados técnicos (raridade, código da carta, set, descrição).
- Preços de mercado (quando disponíveis).

## 🔗 Repositório Oficial
O código fonte do serviço Homura Cards pode ser encontrado em: [https://github.com/vitcas/homura-cards](https://github.com/vitcas/homura-cards)

## 🏗️ Implementação no Cardumy
Para maior compatibilidade com ambientes de deploy como Vercel, o Cardumy realiza chamadas **diretas** para a API Homura Cards no lado do cliente (Frontend).

### Endpoint Direto
- **URL:** `https://homura-cards.vercel.app/api/{game}/cards`
- **Método:** `GET`
- **Parâmetros:**
  - `name`: Termo de pesquisa.
  - `page`: Número da página.
  - `limit`: Resultados por página.

### Fluxo de Requisição
1. O Frontend constrói a URL com base no jogo ativo e parâmetros de busca.
2. O navegador realiza o `fetch` direto para a API externa.
3. A resposta é normalizada no `supabaseService.ts` para exibição no sistema.

## 📊 Mapeamento de Dados
Como cada fonte de TCG (Scryfall, PokémonTCG.io, etc.) tem formatos diferentes, o serviço `supabaseService.ts` realiza uma normalização dos dados retornados pelo Homura:

| Campo Cardumy | Mapeamento Homura (Fonte) | Descrição |
| :--- | :--- | :--- |
| `id` | `c.id` | Identificador único. |
| `name` | `c.name` / `c.juSTname` | Nome da carta (normalizado). |
| `game` | Parâmetro da query | Jogo correspondente. |
| `imageUrl` | `c.imageUrl` / `c.images.small` / `c.images.large` / `c.image` | URL da imagem da carta. |
| `price` | `c.price` / `c.variants[0].price` | Preço em formato numérico. |
| `set` | `c.set.name` / `c.set` / `c.set_name` | Coleção/Expansão. |
| `code` | `c.code` / `c.number` / `c.set_code` | Número/Código do colecionador. |
| `rarity` | `c.rarity` / `c.set_rarity` | Raridade oficial da carta. |
| `variants` | `c.variants` | Lista de variantes (foil, non-foil, etc e seus preços). |

## 🔐 Configuração
As seguintes variáveis de ambiente são necessárias para o funcionamento:
- `HOMURA_URL`: URL base da instância da API (ex: `https://homura-cards.vercel.app`).
- `HOMURA_TOKEN`: Token de autenticação Bearer para acesso ao serviço.

---
*Nota: Esta documentação deve ser mantida atualizada sempre que houver mudanças na interface de comunicação entre o Cardumy e o Homura Cards.*
