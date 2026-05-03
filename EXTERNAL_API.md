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
Para garantir a segurança das chaves de API e contornar problemas de CORS no navegador, o Cardumy implementa um **Proxy reverso** no servidor Node.js/Express.

### Endpoint do Proxy
- **Local:** `/api/cards`
- **Método:** `GET`
- **Parâmetros:**
  - `game`: (Obrigatório) O jogo alvo (ex: `magic`, `pokemon`, `yugioh`).
  - `name`: Termo de pesquisa.
  - `page`: Número da página.
  - `limit`: Resultados por página.

### Fluxo de Requisição
1. O Frontend solicita `/api/cards?game=pokemon&name=charizard`.
2. O servidor `server.ts` recebe a requisição.
3. O servidor anexa o `HOMURA_TOKEN` nos headers de autorização.
4. O servidor encaminha a chamada para `HOMURA_URL/api/{game}/cards`.
5. A resposta é retornada ao frontend de forma transparente.

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
