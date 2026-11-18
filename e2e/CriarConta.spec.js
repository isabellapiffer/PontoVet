// Criar conta com e-mail: com a confirmação de e-mail ligada no Supabase, o signUp
// não devolve sessão. Por isso os dados do formulário vão guardados na conta
// (user_metadata) e são salvos em "tutores" quando a pessoa volta pelo link do e-mail.
// Rodar: npm run e2e
import { test, expect } from "@playwright/test";
import { usarSupabaseFalso, TUTORA } from "./supabaseFalso.js";

const DADOS_BIA = {
  nome: "Bia",
  sobrenome: "Souza",
  cpf: "123.456.789-09",
  data_nascimento: "1995-03-10",
  sexo: "Feminino",
  cep: "88301-000",
  rua: "Rua das Flores",
  numero: "10",
  complemento: "",
  cidade: "Itajaí",
  estado: "SC",
  pais: "Brasil",
};

// Preenche senha, dados pessoais e endereço da Bia (igual no Login e no Completar cadastro)
async function preencherFormulario(page) {
  await page.getByPlaceholder("Crie uma senha").fill("Senha@123");
  await page.getByPlaceholder("Repita a senha").fill("Senha@123");
  await page.getByLabel(/^Nome/).fill("Bia");
  await page.getByLabel(/^Sobrenome/).fill("Souza");
  await page.getByPlaceholder("000.000.000-00").fill("12345678909");
  await page.getByPlaceholder("DD/MM/AAAA").fill("10031995");
  await page.getByLabel(/^Sexo/).fill("Feminino");
  await page.getByLabel(/^Sexo/).press("Enter");
  await page.getByPlaceholder("00000-000").fill("88301000");
  await page.getByLabel(/^Rua/).fill("Rua das Flores");
  await page.getByLabel(/^Número/).fill("10");
  await page.getByLabel(/^Cidade/).fill("Itajaí");
  await page.getByLabel(/^Estado/).fill("SC");
  await page.getByLabel(/^Estado/).press("Enter");
}

// Abre o "Criar conta" com o signUp respondendo "resposta". Devolve o que o app mandou.
async function abrirCriarConta(page, resposta) {
  await usarSupabaseFalso(page, {}, { logada: false });
  // Sem internet: CEP e lista de cidades não respondem
  await page.route(/viacep|ibge/, (route) => route.abort());

  const enviado = { signup: null, salvouTutor: false };
  await page.route("http://supabase-falso.test/auth/v1/signup**", (route) => {
    enviado.signup = { url: route.request().url(), corpo: route.request().postDataJSON() };
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(resposta) });
  });
  page.on("request", (pedido) => {
    if (pedido.url().includes("/rest/v1/tutores") && pedido.method() === "POST") enviado.salvouTutor = true;
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Criar conta" }).click();
  return enviado;
}

test("criar conta: vai direto para os dados e guarda o formulário na conta", async ({ page }) => {
  // Confirmação de e-mail ligada: volta só o usuário, sem sessão
  const enviado = await abrirCriarConta(page, {
    id: "nova-1",
    email: "bia@teste.com",
    identities: [{ provider: "email" }],
  });

  // Sem a escolha "Sou tutor / Sou profissional"
  await expect(page.getByPlaceholder("Crie uma senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sou tutor" })).toHaveCount(0);

  await page.getByPlaceholder("seuemail@exemplo.com").fill("bia@teste.com");
  await preencherFormulario(page);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page.getByRole("heading", { name: "Conta criada!" })).toBeVisible();
  await expect(page.getByText("bia@teste.com")).toBeVisible();
  expect(enviado.signup.corpo.data.tutor).toEqual(DADOS_BIA);
  // O link do e-mail leva para o Completar cadastro, que salva os dados
  expect(decodeURIComponent(enviado.signup.url)).toContain("/completar-cadastro");
  // Sem sessão não dá para salvar em "tutores" agora (era o erro de permissão)
  expect(enviado.salvouTutor).toBe(false);
});

test("criar conta com e-mail que já tem conta: avisa e não diz 'Conta criada'", async ({ page }) => {
  // E-mail já usado: o Supabase devolve um usuário com "identities" vazio
  await abrirCriarConta(page, { id: "falso", email: "bia@teste.com", identities: [] });

  await page.getByPlaceholder("seuemail@exemplo.com").fill("bia@teste.com");
  await preencherFormulario(page);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page.getByText("Já existe uma conta com este e-mail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conta criada!" })).toHaveCount(0);
});

test("criar conta: ao sair do campo E-mail, avisa se o e-mail já tem conta", async ({ page }) => {
  await abrirCriarConta(page, {});
  let emailPerguntado = null;
  await page.route("http://supabase-falso.test/rest/v1/rpc/email_existe", (route) => {
    emailPerguntado = route.request().postDataJSON().email_busca;
    route.fulfill({ status: 200, contentType: "application/json", body: "true" });
  });

  const campoEmail = page.getByPlaceholder("seuemail@exemplo.com");
  await campoEmail.fill("bia@teste.com");
  await campoEmail.blur();

  const aviso = page.getByText("Já existe uma conta com este e-mail");
  await expect(aviso).toBeVisible();
  expect(emailPerguntado).toBe("bia@teste.com");
  // O aviso fica logo abaixo do campo E-mail, antes da Senha
  const caixaAviso = await aviso.boundingBox();
  expect(caixaAviso.y).toBeGreaterThan((await campoEmail.boundingBox()).y);
  expect(caixaAviso.y).toBeLessThan((await page.getByPlaceholder("Crie uma senha").boundingBox()).y);

  // Mudou o e-mail: o aviso some até sair do campo de novo
  await campoEmail.fill("outra@teste.com");
  await expect(aviso).toHaveCount(0);
});

test("completar cadastro: salva sozinho os dados guardados na conta", async ({ page }) => {
  await usarSupabaseFalso(page, { tutores: [] });
  const usuarioComDados = { ...TUTORA, user_metadata: { tutor: DADOS_BIA } };
  let limpouDados = null;
  await page.route("http://supabase-falso.test/auth/v1/user", (route) => {
    if (route.request().method() === "PUT") limpouDados = route.request().postDataJSON();
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usuarioComDados) });
  });
  const salvarTutor = page.waitForRequest(
    (pedido) => pedido.url().includes("/rest/v1/tutores") && pedido.method() === "POST"
  );

  await page.goto("/completar-cadastro?voltar=%2Fmeus-animais");

  expect((await salvarTutor).postDataJSON()).toEqual({ id: TUTORA.id, ...DADOS_BIA });
  await expect(page).toHaveURL(/\/meus-animais$/);
  // A cópia guardada na conta é apagada depois de salvar
  expect(limpouDados.data).toEqual({ tutor: null });
});

test("completar cadastro pelo Google: pede uma senha e salva junto com os dados", async ({ page }) => {
  await usarSupabaseFalso(page, { tutores: [] });
  await page.route(/viacep|ibge/, (route) => route.abort());
  // Conta do Google: sem "email" nos providers, ou seja, ainda sem senha
  const usuarioGoogle = { ...TUTORA, app_metadata: { providers: ["google"] } };
  let senhaSalva = null;
  await page.route("http://supabase-falso.test/auth/v1/user", (route) => {
    if (route.request().method() === "PUT") senhaSalva = route.request().postDataJSON().password;
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usuarioGoogle) });
  });
  const salvarTutor = page.waitForRequest(
    (pedido) => pedido.url().includes("/rest/v1/tutores") && pedido.method() === "POST"
  );

  await page.goto("/completar-cadastro?voltar=%2Fmeus-animais");
  await preencherFormulario(page);
  await page.getByRole("button", { name: "Concluir cadastro" }).click();

  expect((await salvarTutor).postDataJSON()).toEqual({ id: TUTORA.id, ...DADOS_BIA });
  expect(senhaSalva).toBe("Senha@123");
  await expect(page).toHaveURL(/\/meus-animais$/);
});

test("completar cadastro de quem já tem senha (e-mail): não pede senha", async ({ page }) => {
  await usarSupabaseFalso(page, { tutores: [] });
  const usuarioEmail = { ...TUTORA, app_metadata: { providers: ["email"] } };
  await page.route("http://supabase-falso.test/auth/v1/user", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(usuarioEmail) })
  );
  await page.goto("/completar-cadastro");

  await expect(page.getByPlaceholder("000.000.000-00")).toBeVisible();
  await expect(page.getByPlaceholder("Crie uma senha")).toHaveCount(0);
});

test("completar cadastro sem dados guardados (Google): vai direto para os dados", async ({ page }) => {
  await usarSupabaseFalso(page, { tutores: [] });
  await page.goto("/completar-cadastro");

  await expect(page.getByPlaceholder("000.000.000-00")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sou tutor" })).toHaveCount(0);
});
