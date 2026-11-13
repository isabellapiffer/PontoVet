# 🐾 PontoVet

> 🚧 **Em desenvolvimento.** Esta é a primeira versão, ainda incompleta. Algumas telas já aparecem, mas os botões ainda não funcionam.

O PontoVet é um app para o **tutor** guardar o histórico de saúde dos seus animais em um só lugar: vacinas, remédios, exames e compromissos.

Nas próximas versões, veterinários e clínicas também vão usar o app, e o tutor poderá agendar consultas por ele.

## ✅ O que já funciona

- **Cadastro de pets**: dados do animal, foto e histórico clínico.
- **Vacinas com carteirinha**: o tutor registra as vacinas e guarda a foto ou o PDF da carteirinha em uma pasta privada.
- **Agenda com lembretes**: compromissos, remédios e exames com preparo (jejum, por exemplo), vistos por semana ou por mês.
- **Busca por cidade**: veterinários e clínicas, em ordem de distância.
- **Perfil do veterinário**: informações, "Sobre mim" e avaliações.

> **Os profissionais da busca são fictícios.** Nomes, endereços, notas e avaliações são inventados, só para demonstração. As fotos são do [Pexels](https://www.pexels.com/license/), de uso livre; os créditos estão em `public/fotos-fake/CREDITOS.md`.

## 🛠️ Tecnologias

- [React](https://react.dev) e [Vite](https://vite.dev): as telas do app.
- [Supabase](https://supabase.com): login, banco de dados e armazenamento de arquivos.
- [Vitest](https://vitest.dev): testes das funções.
- [Playwright](https://playwright.dev): testes das telas no navegador.

## 💻 Como rodar no computador

Você precisa ter o [Node.js](https://nodejs.org) instalado e um projeto criado no Supabase.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz do projeto com os dados do seu projeto no Supabase:

   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

3. Rode no SQL Editor do Supabase os arquivos da pasta [`supabase/`](supabase/). Eles criam as tabelas, as regras de acesso e as pastas de arquivos.

4. Ligue o app:

   ```bash
   npm run dev
   ```

   Depois abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

## 🧪 Como rodar os testes

```bash
npm test         # testes das funções (Vitest)
npm run e2e      # testes das telas no navegador (Playwright)
```

Na primeira vez, antes do `npm run e2e`, instale o navegador do Playwright com `npx playwright install`.

Os testes de tela usam um Supabase falso. Eles não precisam do `.env` e não mexem no banco de verdade.
