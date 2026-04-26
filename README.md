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
- **Express (Node.js)**: Servidor back-end que sustenta a aplicação em modo full-stack.
- **tsx**: Execução do servidor TypeScript diretamente em tempo de desenvolvimento.

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
- `/pages`: Visualizações principais da aplicação.
- `server.ts`: Ponto de entrada do servidor Node.js/Express.

---
Desenvolvido com ❤️ para a comunidade TCG.
