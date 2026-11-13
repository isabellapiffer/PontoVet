import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // A pasta e2e/ é do Playwright; o Vitest (npm test) não deve rodar esses arquivos
  test: { exclude: [...configDefaults.exclude, 'e2e/**'] },
})
