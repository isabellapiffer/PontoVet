// Traduz os erros do Supabase (que vêm em inglês) para uma frase simples em português.
// O erro técnico continua no console (F12), para a gente conseguir investigar.
export function mensagemDeErro(error) {
  if (!error) return "";
  console.error(error);

  const codigo = String(error.code || "");
  const texto = String(error.message || "").toLowerCase();

  // Sem internet ou Supabase fora do ar
  if (texto.includes("failed to fetch") || texto.includes("network")) {
    return "Sem conexão. Confira a internet e tente de novo.";
  }

  // Criar conta. Não diz se o e-mail já tem conta (senão qualquer um descobre
  // quem usa o PontoVet testando e-mails)
  if (codigo === "user_already_exists" || texto.includes("already registered")) {
    return "Não foi possível criar a conta. Confira os dados e tente de novo.";
  }
  if (codigo === "weak_password" || texto.includes("password should")) {
    return "Senha fraca. Use pelo menos 8 caracteres, com letra maiúscula, número e caractere especial.";
  }
  if (codigo === "email_address_invalid" || texto.includes("invalid format")) {
    return "E-mail inválido. Confira se digitou certo.";
  }
  if (codigo.includes("rate_limit") || texto.includes("rate limit")) {
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  }

  // Banco de dados
  if (codigo === "23505") return "Esse cadastro já existe (CPF, CRMV ou CNPJ repetido).";
  if (codigo === "23514") return "Algum campo está com valor inválido. Confira e tente de novo.";
  if (codigo === "42501") return "Você não tem permissão para fazer isso. Entre de novo na sua conta.";

  return "Algo deu errado. Tente de novo.";
}
