export function requisitosSenha(valor) {
  return [
    { texto: "Mínimo 8 caracteres", ok: valor.length >= 8 },
    { texto: "1 letra maiúscula", ok: /[A-Z]/.test(valor) },
    { texto: "1 número", ok: /[0-9]/.test(valor) },
    { texto: "1 caractere especial", ok: /[^A-Za-z0-9]/.test(valor) },
  ];
}

export function validarSenha(valor) {
  return requisitosSenha(valor).every((requisito) => requisito.ok);
}

export function formatarCpf(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCnpj(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatarTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  const comDdd = digitos.replace(/(\d{2})(\d)/, "($1) $2");

  // Celular (11 dígitos): 5 antes do tracinho. Ex.: (47) 99999-9999
  if (digitos.length === 11) {
    return comDdd.replace(/(\d{5})(\d{4})$/, "$1-$2");
  }

  // Fixo ou ainda digitando: 4 antes do tracinho. Ex.: (47) 3333-4444
  return comDdd.replace(/(\d{4})(\d{1,4})$/, "$1-$2");
}

export function formatarCep(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

// travarAno: true (padrão) não deixa passar do ano atual (datas de nascimento).
// false: aceita anos futuros (vacina, remédio e agenda, que podem ser marcados para depois).
export function formatarData(valor, travarAno = true) {
  const digitados = valor.replace(/\D/g, "");
  let digitos = "";

  for (const digito of digitados) {
    if (digitos.length >= 8) break;

    const posicao = digitos.length;

    // 1º dígito do dia: só 0,1,2,3 (não existe dia começando com 4-9)
    if (posicao === 0 && !"0123".includes(digito)) continue;
    // 2º dígito do dia: se começou com 3, só 0 ou 1 (dia máximo 31)
    if (posicao === 1 && digitos[0] === "3" && !"01".includes(digito)) continue;
    // 1º dígito do mês: só 0 ou 1
    if (posicao === 2 && !"01".includes(digito)) continue;
    // 2º dígito do mês: se começou com 1, só 0,1,2 (mês máximo 12)
    if (posicao === 3 && digitos[2] === "1" && !"012".includes(digito)) continue;

    digitos += digito;
  }

  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  let ano = digitos.slice(4, 8);

  if (travarAno && ano.length === 4) {
    const anoAtual = new Date().getFullYear();
    ano = String(Math.min(Number(ano), anoAtual)).padStart(4, "0");
  }

  let resultado = dia;
  if (mes) resultado += "/" + mes;
  if (ano) resultado += "/" + ano;

  return resultado;
}

const nomesDosMeses = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function validarData(valor) {
  const [dia, mes, ano] = valor.split("/");

  if (!dia || !mes || !ano || dia.length !== 2 || mes.length !== 2 || ano.length !== 4) {
    return "Data inválida: preencha a data completa (dd/mm/aaaa).";
  }

  if (dia === "00") {
    return "Data inválida: o dia 00 não existe.";
  }

  if (mes === "00") {
    return "Data inválida: o mês 00 não existe.";
  }

  if (Number(mes) > 12) {
    return `Data inválida: o mês ${mes} não existe.`;
  }

  // O dia 0 de um mês volta para o último dia do mês anterior.
  // Ex.: new Date(2021, 2, 0) é 28/02/2021, então fevereiro de 2021 tem 28 dias.
  const ultimoDiaDoMes = new Date(Number(ano), Number(mes), 0).getDate();

  if (Number(dia) > ultimoDiaDoMes) {
    const nomeDoMes = nomesDosMeses[Number(mes) - 1];
    return `Data inválida: ${nomeDoMes} de ${ano} não tem dia ${dia}.`;
  }

  return "";
}

// ---------- Data só com mês e ano (ex.: data do diagnóstico) ----------

// "082026" vira "08/2026"
export function formatarMesAno(valor) {
  const digitados = valor.replace(/\D/g, "");
  let digitos = "";

  for (const digito of digitados) {
    if (digitos.length >= 6) break;

    // 1º dígito do mês de 2 a 9: completa com o zero ("8" vira "08")
    if (digitos.length === 0 && !"01".includes(digito)) {
      digitos = "0" + digito;
      continue;
    }
    // 2º dígito do mês: se começou com 1, só 0,1,2 (mês máximo 12)
    if (digitos.length === 1 && digitos[0] === "1" && !"012".includes(digito)) continue;

    digitos += digito;
  }

  const mes = digitos.slice(0, 2);
  const ano = digitos.slice(2);
  return ano ? `${mes}/${ano}` : mes;
}

export function validarMesAno(valor) {
  const [mes, ano] = valor.split("/");

  if (!mes || !ano || mes.length !== 2 || ano.length !== 4) {
    return "Data inválida: preencha o mês e o ano (mm/aaaa).";
  }

  if (mes === "00") {
    return "Data inválida: o mês 00 não existe.";
  }

  if (Number(ano) < 1990) {
    return "Data inválida: o ano precisa ser 1990 ou depois.";
  }

  return "";
}

// "08/2026" (da tela) vira "2026-08" (do banco)
export function paraMesISO(valor) {
  const [mes, ano] = valor.split("/");
  return `${ano}-${mes}`;
}

// O contrário: "2026-08" (do banco) vira "08/2026" (da tela)
export function deMesISO(valor) {
  // Valor vazio ou fora do formato "aaaa-mm": não mostra nada (em vez de "undefined")
  if (!/^\d{4}-\d{2}$/.test(valor || "")) return "";
  const [ano, mes] = valor.split("-");
  return `${mes}/${ano}`;
}

export function campoVazio(tentou, valor) {
  return tentou && !valor;
}

// Recebe os campos obrigatórios e devolve o nome dos que estão vazios
// (ou só com espaços). Ex.: camposVazios({ nome: "Ana", cpf: " " }) devolve ["cpf"]
export function camposVazios(campos) {
  return Object.keys(campos).filter((campo) => !campos[campo].trim());
}

// ---------- Idade aproximada do pet ----------

// Data de nascimento estimada: hoje menos X anos e Y meses,
// como se o aniversário fosse no dia do cadastro. Devolve "aaaa-mm-dd".
export function dataEstimada(anos, meses) {
  const hoje = new Date();
  const totalMeses = hoje.getMonth() - (anos * 12 + meses);
  const ano = hoje.getFullYear() + Math.floor(totalMeses / 12);
  const mes = ((totalMeses % 12) + 12) % 12; // 0 a 11
  // Ex.: hoje é 31/03 e o mês de destino é fevereiro: usa o último dia (28 ou 29)
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const dia = Math.min(hoje.getDate(), ultimoDia);
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// O contrário: a partir da data "aaaa-mm-dd", quantos anos e meses tem hoje.
export function idadeEmAnosEMeses(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const hoje = new Date();
  let totalMeses =
    (hoje.getFullYear() - ano) * 12 + (hoje.getMonth() + 1 - mes);
  if (hoje.getDate() < dia) totalMeses -= 1;
  totalMeses = Math.max(totalMeses, 0);
  return { anos: Math.floor(totalMeses / 12), meses: totalMeses % 12 };
}

// Texto da idade: "1 ano e 5 meses", "2 anos", "5 meses", "menos de 1 mês"
export function textoIdade({ anos, meses }) {
  const partes = [];
  if (anos > 0) partes.push(anos === 1 ? "1 ano" : `${anos} anos`);
  if (meses > 0) partes.push(meses === 1 ? "1 mês" : `${meses} meses`);
  return partes.length ? partes.join(" e ") : "menos de 1 mês";
}

// O contrário do paraDataISO: "1995-08-15" (do banco) vira "15/08/1995" (da tela)
export function deDataISO(valor) {
  if (!valor) return "";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function paraDataISO(valor) {
  const [dia, mes, ano] = valor.split("/");
  if (!dia || !mes || !ano || ano.length !== 4) return null;
  return `${ano}-${mes}-${dia}`;
}
