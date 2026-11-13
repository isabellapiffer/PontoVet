// Supabase FALSO para os testes do Playwright.
// Todo pedido do app para http://supabase-falso.test é respondido aqui,
// com as tabelas que cada teste passar. Nada sai para a internet.

export const TUTORA = { id: "tutora-1", email: "ana@teste.com" };

// Sessão de login guardada no navegador, como o Supabase faz depois que a pessoa entra.
// O app lê daqui e acha que a Ana está logada.
function sessaoFalsa() {
  const umAno = 60 * 60 * 24 * 365;
  const expira = Math.floor(Date.now() / 1000) + umAno;
  const base64 = (objeto) => Buffer.from(JSON.stringify(objeto)).toString("base64url");
  const token = `${base64({ alg: "HS256", typ: "JWT" })}.${base64({ sub: TUTORA.id, exp: expira, role: "authenticated" })}.assinatura`;
  return {
    access_token: token,
    refresh_token: "refresh-falso",
    token_type: "bearer",
    expires_in: umAno,
    expires_at: expira,
    user: TUTORA,
  };
}

// Filtra as linhas pelos ".eq()" do pedido. Ex.: ?tutor_id=eq.tutora-1
function filtrar(linhas, parametros) {
  return linhas.filter((linha) =>
    [...parametros].every(([coluna, valor]) =>
      valor.startsWith("eq.") ? String(linha[coluna]) === valor.slice(3) : true
    )
  );
}

function responder(route, tabelas, logada) {
  const pedido = route.request();
  const url = new URL(pedido.url());
  const json = (status, corpo) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(corpo) });

  if (url.pathname === "/auth/v1/user") {
    return logada ? json(200, TUTORA) : json(401, { message: "sem login" });
  }
  if (url.pathname.startsWith("/auth/")) return json(200, {});
  if (url.pathname.startsWith("/rest/v1/rpc/")) return json(200, false);
  if (url.pathname.startsWith("/storage/")) return json(200, []);

  // Salvar, alterar e apagar: finge que deu certo
  if (pedido.method() !== "GET") return json(201, []);

  const tabela = url.pathname.replace("/rest/v1/", "");
  const linhas = filtrar(tabelas[tabela] || [], url.searchParams);

  // .single() pede UMA linha em vez de uma lista
  if ((pedido.headers()["accept"] || "").includes("vnd.pgrst.object")) {
    return linhas.length ? json(200, linhas[0]) : json(406, { message: "nenhuma linha" });
  }
  return json(200, linhas);
}

// Liga o Supabase falso numa página. Chame ANTES do page.goto().
export async function usarSupabaseFalso(page, tabelas = {}, { logada = true } = {}) {
  if (logada) {
    await page.addInitScript((sessao) => {
      localStorage.setItem("sb-supabase-falso-auth-token", JSON.stringify(sessao));
    }, sessaoFalsa());
  }
  await page.route("http://supabase-falso.test/**", (route) => responder(route, tabelas, logada));
  // Trava de segurança: se algo tentar falar com o Supabase de verdade, é bloqueado
  await page.route("**/*.supabase.co/**", (route) => route.abort());
}

// Dados prontos: a Ana com a cadela Luna, sem compromissos
export const DADOS_ANA = {
  tutores: [{ id: TUTORA.id, nome: "Ana", rua: "Rua das Flores", numero: "10", cidade: "Itajaí", estado: "SC" }],
  pets: [
    {
      id: "pet-luna",
      tutor_id: TUTORA.id,
      nome: "Luna",
      especie: "Canino",
      raca: "Vira-lata (SRD)",
      foto_url: null,
      medicacoes: [],
      vacinas: [],
      vermifugacoes: [],
      antiparasitarios: [],
    },
  ],
  compromissos: [],
};
