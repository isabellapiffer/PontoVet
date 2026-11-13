import { supabase } from "./supabaseClient.js";
import { deDataISO } from "./formatadores.js";

// Só medicações dadas a cada semana(s), mês(es) ou ano(s) geram lembrete.
// As de horas e dias ficariam lembrando todo dia.
export const TEMPOS_COM_LEMBRETE = ["semana", "mes", "ano"];

// Data de hoje no formato do banco ("2026-10-24"), no horário do Brasil
export function hojeISO() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Soma um intervalo a uma data: ("2026-10-01", 1, "mes") => "2026-11-01"
export function somarIntervalo(dataISO, quantidade, tempo) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const n = Number(quantidade);
  let data;

  if (tempo === "dia") {
    data = new Date(ano, mes - 1, dia + n);
  } else if (tempo === "semana") {
    data = new Date(ano, mes - 1, dia + 7 * n);
  } else if (tempo === "mes" || tempo === "ano") {
    const meses = tempo === "mes" ? n : 12 * n;
    // Dia 31 num mês de 30 dias vira o último dia do mês (e não o dia 1 do outro)
    const ultimoDia = new Date(ano, mes - 1 + meses + 1, 0).getDate();
    data = new Date(ano, mes - 1 + meses, Math.min(dia, ultimoDia));
  } else {
    return null;
  }

  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${m}-${d}`;
}

// Todos os lembretes de um pet (vencidos ou não), do mais antigo para o mais novo
export function lembretesDoPet(pet) {
  const lembretes = [];

  (pet.medicacoes || []).forEach((med, indice) => {
    if (!med?.nome) return; // dado quebrado: pula, sem derrubar a tela
    if (!TEMPOS_COM_LEMBRETE.includes(med.intervaloTempo)) return;
    if (!med.ultimaDose || !Number(med.intervalo)) return;

    lembretes.push({
      id: `${pet.id}-med-${indice}`,
      tipo: "medicacao",
      titulo: med.nome,
      data: somarIntervalo(med.ultimaDose, med.intervalo, med.intervaloTempo),
      pet,
      medicacao: med,
    });
  });

  // Vacinas: para cada vacina (V10, Antirrábica...), vale a dose mais recente
  const ultimaPorVacina = {};
  (pet.vacinas || []).forEach((vacina) => {
    if (!vacina?.produto || !vacina.data) return; // dado quebrado: pula
    const chave = vacina.produto.trim().toLowerCase();
    const atual = ultimaPorVacina[chave];
    if (!atual || vacina.data > atual.data) ultimaPorVacina[chave] = vacina;
  });

  Object.values(ultimaPorVacina).forEach((vacina) => {
    if (!vacina.proxima) return;
    lembretes.push({
      id: `${pet.id}-vacina-${vacina.produto}`,
      tipo: "vacina",
      titulo: `Vacina ${vacina.produto}`,
      data: vacina.proxima,
      pet,
    });
  });

  // Vermífugo e antipulgas: vale a vez MAIS RECENTE da lista inteira
  // (se trocou de Drontal para outro vermífugo, a próxima do Drontal não conta mais)
  [
    ["vermifugo", "Vermífugo", pet.vermifugacoes],
    ["antiparasitario", "Antipulgas e carrapatos", pet.antiparasitarios],
  ].forEach(([tipo, nomeTipo, lista]) => {
    const validos = (lista || []).filter((registro) => registro?.produto && registro.data);
    if (!validos.length) return;
    const ultimaData = validos.reduce((maior, r) => (r.data > maior ? r.data : maior), "");
    validos
      .filter((registro) => registro.data === ultimaData && registro.proxima)
      .forEach((registro) => {
        lembretes.push({
          id: `${pet.id}-${tipo}-${registro.produto}`,
          tipo,
          titulo: `${nomeTipo} ${registro.produto}`,
          data: registro.proxima,
          pet,
        });
      });
  });

  return lembretes.sort((a, b) => a.data.localeCompare(b.data));
}

// ---------- Preparo de exame ----------
// O preparo fica no compromisso do exame (coluna "preparo"):
// { jejumHoras: 8, medicamento: { nome: "Luftal", instrucao: "10 gotas, 1 hora antes" }, outro: "..." }

// "10 gotas, 1 hora antes" -> 60; "30 minutos antes" -> 30; sem "antes" -> null
export function minutosAntes(instrucao) {
  const achou = /(\d+)\s*(h|hr|hrs|hora|horas|min|minuto|minutos)\b\s*antes/i.exec(instrucao || "");
  if (!achou) return null;
  const numero = Number(achou[1]);
  return achou[2].toLowerCase().startsWith("m") ? numero : numero * 60;
}

// Volta X minutos a partir do dia e hora do exame:
// ("2026-11-12", "09:00", 480) -> { data: "2026-11-12", hora: "01:00" }
// ("2026-11-12", "06:00", 480) -> { data: "2026-11-11", hora: "22:00" } (dia anterior)
export function voltarMinutos(dataISO, hora, minutos) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const momento = new Date(ano, mes - 1, dia, h, m - minutos);
  const doisDigitos = (n) => String(n).padStart(2, "0");
  return {
    data: `${momento.getFullYear()}-${doisDigitos(momento.getMonth() + 1)}-${doisDigitos(momento.getDate())}`,
    hora: `${doisDigitos(momento.getHours())}:${doisDigitos(momento.getMinutes())}`,
  };
}

// Quando começa o jejum e quando dar o remédio. Só dá para calcular com a hora do exame.
// Devolve { jejum: { data, hora } ou null, medicamento: { data, hora } ou null }
export function horariosDoPreparo(preparo, dataISO, hora) {
  const horarios = { jejum: null, medicamento: null };
  if (!preparo || !dataISO || !hora) return horarios;

  if (Number(preparo.jejumHoras) > 0) {
    horarios.jejum = voltarMinutos(dataISO, hora, Number(preparo.jejumHoras) * 60);
  }
  const minutos = minutosAntes(preparo.medicamento?.instrucao);
  if (preparo.medicamento?.nome && minutos !== null) {
    horarios.medicamento = voltarMinutos(dataISO, hora, minutos);
  }
  return horarios;
}

// Resumo para a Agenda e o histórico:
// "Jejum de 8 horas · Luftal: 10 gotas, 1 hora antes · Levar a urina"
export function resumoPreparo(preparo) {
  if (!preparo) return "";
  const partes = [];
  const horas = Number(preparo.jejumHoras);
  if (horas > 0) partes.push(`Jejum de ${horas} ${horas === 1 ? "hora" : "horas"}`);
  if (preparo.medicamento?.nome) {
    const { nome, instrucao } = preparo.medicamento;
    partes.push(instrucao ? `${nome}: ${instrucao}` : nome);
  }
  if (preparo.outro) partes.push(preparo.outro);
  return partes.join(" · ");
}

// Os avisos do preparo de UM exame agendado, para a lista de Lembretes.
// Cada aviso aparece do dia em que começa (data) até o dia do exame (ateData).
// Ex.: exame dia 12 às 06:00 com jejum de 8 horas -> "Jejum a partir de 22:00",
// que aparece no dia 11 e no dia 12.
export function avisosDoPreparo(compromisso, pet) {
  const preparo = compromisso.preparo;
  if (!preparo || !pet) return [];

  const hora = compromisso.hora ? compromisso.hora.slice(0, 5) : ""; // "09:00:00" -> "09:00"
  const horarios = horariosDoPreparo(preparo, compromisso.data, hora);
  const avisos = [];

  function aviso(chave, titulo, data) {
    avisos.push({
      id: `preparo-${compromisso.id}-${chave}`,
      tipo: "preparo",
      titulo,
      data,
      ateData: compromisso.data,
      pet,
    });
  }

  const horas = Number(preparo.jejumHoras);
  if (horarios.jejum) {
    aviso("jejum", `Jejum a partir de ${horarios.jejum.hora}`, horarios.jejum.data);
  } else if (horas > 0) {
    // Sem a hora do exame: avisa só no dia, com o tempo de jejum
    aviso("jejum", `Jejum de ${horas} ${horas === 1 ? "hora" : "horas"}`, compromisso.data);
  }

  const remedio = preparo.medicamento;
  if (horarios.medicamento) {
    aviso("medicamento", `Dar ${remedio.nome} às ${horarios.medicamento.hora}`, horarios.medicamento.data);
  } else if (remedio?.nome) {
    aviso(
      "medicamento",
      remedio.instrucao ? `${remedio.nome}: ${remedio.instrucao}` : remedio.nome,
      compromisso.data
    );
  }

  if (preparo.outro) aviso("outro", preparo.outro, compromisso.data);

  return avisos;
}

// Avisos de preparo que valem HOJE (no dia anterior ao exame, se o jejum
// começa antes da meia-noite, e no dia do exame), de vários pets
export function avisosDoPreparoDeHoje(compromissos, pets) {
  const hoje = hojeISO();
  return compromissos
    .flatMap((compromisso) =>
      avisosDoPreparo(compromisso, pets.find((pet) => pet.id === compromisso.pet_id))
    )
    .filter((aviso) => aviso.data <= hoje && hoje <= aviso.ateData);
}

// Nome do tipo de cada item da Agenda e da tela inicial ("Lembrete de vacina", "Consulta"...)
export function nomeDoTipo(item) {
  if (item.tipo === "medicacao") return "Lembrete de remédio";
  if (item.tipo === "vacina") return item.compromisso ? "Vacina agendada" : "Lembrete de vacina";
  if (item.tipo === "vermifugo") {
    return item.compromisso ? "Vermífugo agendado" : "Lembrete de vermífugo";
  }
  if (item.tipo === "antiparasitario") {
    return item.compromisso
      ? "Antipulgas e carrapatos agendado"
      : "Lembrete de antipulgas e carrapatos";
  }
  if (item.tipo === "consulta") return "Consulta";
  if (item.tipo === "exame") return "Exame";
  return "Compromisso";
}

// Compromissos do banco no mesmo formato dos lembretes, para entrar nas listas.
// Compromisso de pet fora da lista (filtrado ou apagado) fica de fora.
export function itensDosCompromissos(compromissos, pets) {
  return compromissos
    .map((c) => ({
      id: `compromisso-${c.id}`,
      tipo: c.tipo,
      titulo: c.titulo,
      data: c.data,
      hora: c.hora ? c.hora.slice(0, 5) : "", // "14:30:00" -> "14:30"
      pet: pets.find((p) => p.id === c.pet_id),
      compromisso: c,
    }))
    .filter((item) => item.pet);
}

// Os 5 mais perto. No mesmo dia, os com hora vêm primeiro ("99" = sem hora, vai para o fim).
function cincoMaisPerto(itens) {
  return itens
    .sort((a, b) => (a.data + (a.hora || "99")).localeCompare(b.data + (b.hora || "99")))
    .slice(0, 5);
}

// "Próximos agendamentos" da Agenda: de amanhã em diante.
// O dia escolhido fica de fora, porque já aparece na lista do dia.
export function proximosDaAgenda(itens, hoje, diaEscolhido) {
  return cincoMaisPerto(itens.filter((item) => item.data > hoje && item.data !== diaEscolhido));
}

// "Próximos agendamentos" da tela inicial: compromissos de hoje em diante e
// lembretes de amanhã em diante (os de hoje já aparecem em Lembretes)
export function proximosDaTelaInicial(pets, compromissos, hoje) {
  const lembretes = pets.flatMap(lembretesDoPet).filter((lembrete) => lembrete.data > hoje);
  const agendados = itensDosCompromissos(compromissos, pets).filter((item) => item.data >= hoje);
  return cincoMaisPerto([...lembretes, ...agendados]);
}

// 2ª linha do card da tela inicial:
// "11/11 às 15:00 · Dra Ana" (compromisso) ou "30/11 · Lembrete de vacina" (lembrete)
export function quandoEOnde(item) {
  let texto = deDataISO(item.data).slice(0, 5);
  if (item.hora) texto += ` às ${item.hora}`;
  const onde = item.compromisso ? item.compromisso.local : nomeDoTipo(item);
  return onde ? `${texto} · ${onde}` : texto;
}

// Lembretes que já chegaram (hoje ou atrasados), de vários pets
export function lembretesDeHoje(pets) {
  const hoje = hojeISO();
  return pets
    .flatMap(lembretesDoPet)
    .filter((lembrete) => lembrete.data <= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
}

// "Feito": a medicação foi dada hoje, então o próximo lembrete é calculado a partir de hoje.
// Busca a lista ATUAL no banco antes de gravar (ela pode ter mudado em outro aparelho)
// e acha a medicação pelo conteúdo, não pela posição.
export async function marcarMedicacaoComoDada(lembrete, tutorId) {
  const { data: pet, error: erroBusca } = await supabase
    .from("pets")
    .select("medicacoes")
    .eq("id", lembrete.pet.id)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  if (erroBusca) return erroBusca;
  if (!pet) return new Error("Pet não encontrado.");

  const alvo = lembrete.medicacao;
  const indice = (pet.medicacoes || []).findIndex(
    (med) =>
      med.nome === alvo.nome &&
      med.intervalo === alvo.intervalo &&
      med.intervaloTempo === alvo.intervaloTempo &&
      med.ultimaDose === alvo.ultimaDose
  );
  // A medicação mudou ou foi apagada em outro lugar: não grava nada
  if (indice === -1) return new Error("A medicação mudou. Atualize a tela.");

  const medicacoes = pet.medicacoes.map((med, i) =>
    i === indice ? { ...med, ultimaDose: hojeISO() } : med
  );

  const { data: alterados, error } = await supabase
    .from("pets")
    .update({ medicacoes })
    .eq("id", lembrete.pet.id)
    .eq("tutor_id", tutorId)
    .select("id");

  if (error) return error;
  // Sem erro mas sem linha alterada = o banco bloqueou (regra de segurança)
  if (!alterados?.length) return new Error("Nada foi salvo.");
  return null;
}
