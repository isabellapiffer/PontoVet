// "Esqueceu seu e-mail/senha?": a pessoa recebe um código no e-mail, digita o
// código e cria uma senha nova. Serve também para quem criou a conta pelo Google
// passar a entrar com e-mail e senha. Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, sessaoFalsa, TUTORA, DADOS_ANA } from "./supabaseFalso.js";

test("recuperar senha: e-mail, código e senha nova", async ({ page }) => {
  await usarSupabaseFalso(page, DADOS_ANA, { logada: false });

  const enviado = { recover: null, verify: null, senha: null };
  await page.route("http://supabase-falso.test/auth/v1/recover**", (route) => {
    enviado.recover = route.request().postDataJSON();
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("http://supabase-falso.test/auth/v1/verify**", (route) => {
    enviado.verify = route.request().postDataJSON();
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessaoFalsa()) });
  });
  await page.route("http://supabase-falso.test/auth/v1/user", (route) => {
    if (route.request().method() === "PUT") enviado.senha = route.request().postDataJSON().password;
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TUTORA) });
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Esqueceu seu e-mail/senha?" }).click();

  await page.getByPlaceholder("seuemail@exemplo.com").fill("ana@teste.com");
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page.getByText("Enviamos um código para")).toBeVisible();
  expect(enviado.recover.email).toBe("ana@teste.com");

  await page.getByPlaceholder("Código do e-mail").fill("123456");
  await page.getByPlaceholder("Crie uma senha").fill("Senha@123");
  await page.getByPlaceholder("Repita a senha").fill("Senha@123");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();

  // Já entra no app (a Ana tem cadastro, então vai para a tela inicial)
  await expect(page).toHaveURL(/\/$/);
  expect(enviado.verify).toMatchObject({ email: "ana@teste.com", token: "123456", type: "recovery" });
  expect(enviado.senha).toBe("Senha@123");
});

test("recuperar senha: código errado mostra aviso e não troca a senha", async ({ page }) => {
  await usarSupabaseFalso(page, {}, { logada: false });
  await page.route("http://supabase-falso.test/auth/v1/recover**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.route("http://supabase-falso.test/auth/v1/verify**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: "otp_expired", message: "Token has expired or is invalid" }),
    })
  );
  let trocouSenha = false;
  page.on("request", (pedido) => {
    if (pedido.url().endsWith("/auth/v1/user") && pedido.method() === "PUT") trocouSenha = true;
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Esqueceu seu e-mail/senha?" }).click();
  await page.getByPlaceholder("seuemail@exemplo.com").fill("ana@teste.com");
  await page.getByRole("button", { name: "Enviar código" }).click();
  await page.getByPlaceholder("Código do e-mail").fill("000000");
  await page.getByPlaceholder("Crie uma senha").fill("Senha@123");
  await page.getByPlaceholder("Repita a senha").fill("Senha@123");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();

  await expect(page.getByText("Código errado ou vencido")).toBeVisible();
  expect(trocouSenha).toBe(false);
});
