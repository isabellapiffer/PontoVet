// Configuração do Playwright (testes que abrem o navegador).
// Rodar: npm run e2e
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // A tela de abertura (Splash) leva 2,5 s; 10 s dá folga para cada conferência
  expect: { timeout: 10000 },
  use: { baseURL: "http://localhost:5174" },
  // Antes dos testes, o Playwright liga o app sozinho (igual ao npm run dev).
  // Porta 5174 para não misturar com o app que você abre no 5173.
  webServer: {
    command: "npx vite --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: false,
    // Endereço FALSO do Supabase: nenhum pedido chega ao banco de verdade
    env: {
      VITE_SUPABASE_URL: "http://supabase-falso.test",
      VITE_SUPABASE_ANON_KEY: "chave-falsa",
    },
  },
});
