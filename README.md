# Cardumy TCG 🎴

Cardumy é a plataforma definitiva para colecionadores de Card Games. Organize sua coleção, crie wishlists, gerencie trocas e conecte-se com outros entusiastas.

## 🚀 Tecnologias e Dependências Cruciais

O projeto foi construído utilizando as seguintes ferramentas fundamentais:

### Frontend
- **React 19 & TypeScript**: Framework robusto para interfaces dinâmicas e tipagem segura.
- **Vite**: Build tool ultra-rápida para desenvolvimento moderno.
- **Tailwind CSS**: Estilização baseada em utilitários para um design consistente e responsivo.
- **Motion (motion/react)**: Responsável pelas animações fluidas e transições de página.
- **React Router Dom (v7)**: Gerenciamento de rotas e navegação complexa (SPAs).

### Backend & Persistência
- **Supabase (@supabase/supabase-js)**: Integração crucial para Autenticação, Banco de Dados (PostgreSQL) e Real-time.
- **Express (Node.js)**: Servidor back-end que sustenta a aplicação em modo full-stack, gerenciando proxies de API e segurança.
- **tsx**: Execução do servidor TypeScript diretamente em tempo de desenvolvimento.

## 🏗️ Arquitetura Full-Stack

A aplicação utiliza uma arquitetura unificada:
- **Client Side**: React montado via Vite para uma experiência de SPA rápida e responsiva.
- **Server Side**: Express servindo como gateway para APIs protegidas, cache e proxy para serviços externos (Supabase Admin, Homura API).

### Iconografia
- **Font Awesome & Lucide React**: Biblioteca de ícones consistente para toda a interface.

## 🛠️ Como Iniciar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente (`.env` baseado no `.env.example`).
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 📂 Estrutura do Projeto

- `/src/components`: Componentes reutilizáveis de UI.
- `/src/services`: Lógica de integração com Supabase e APIs externas.
- `/src/pages`: Visualizações principais da aplicação.
- `/src/lib`: Utilitários e instâncias de clientes (Supabase).
- `/src/types.ts` & `/src/constants.tsx`: Definições globais de tipos e constantes.
- `server.ts`: Ponto de entrada do servidor Node.js/Express (Full-stack).

---
Desenvolvido com ❤️ para a comunidade TCG.
