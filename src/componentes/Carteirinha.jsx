import { useEffect, useRef, useState } from "react";
import {
  IoChevronForward,
  IoDocumentTextOutline,
  IoImageOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { supabase } from "../supabaseClient.js";
import {
  PASTA_DOCUMENTOS,
  LIMITE_ARQUIVOS,
  caminhoCarteirinha,
  erroArquivo,
  linhasCarteirinha,
  linhasPendentes,
  pastaCarteirinha,
  tipoDoArquivo,
} from "../carteirinha.js";
import "../paginas/login.css"; // aviso-cpf (texto vermelho do aviso)
import "./historicoclinico.css";
import "./carteirinha.css";

// Carteirinha de vacinação (protótipo 23B, lista). Fica dentro de Vacinas.
// editar = false: só a lista (perfil do pet). true: lixeira e "+ Anexar carteirinha" (lápis).
// O arquivo sobe e é apagado na hora, sem esperar o "Salvar" do formulário.
// Cadastro de pet novo (sem petId): o pet ainda não existe, então os arquivos ficam
// em pendentes (lista do FormularioPet), que envia tudo depois de salvar o pet.
export default function Carteirinha({ tutorId, petId, editar = false, pendentes, aoMudarPendentes }) {
  const [linhas, setLinhas] = useState([]);
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Muda depois de anexar ou remover: faz a lista carregar de novo
  const [versao, setVersao] = useState(0);
  const campoArquivo = useRef(null);
  const pasta = pastaCarteirinha(tutorId, petId);
  const documentos = supabase.storage.from(PASTA_DOCUMENTOS);
  // Pet já salvo: a lista vem da pasta. Pet novo: os arquivos esperando o "Salvar pet"
  const lista = petId ? linhas : linhasPendentes(pendentes);

  useEffect(() => {
    if (!tutorId || !petId) return;
    supabase.storage
      .from(PASTA_DOCUMENTOS)
      .list(pasta, { limit: 100 })
      .then(({ data, error }) => {
        if (error) setAviso("Não foi possível carregar a carteirinha.");
        else setLinhas(linhasCarteirinha(data, pasta));
      });
  }, [tutorId, petId, pasta, versao]);

  async function anexar(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = ""; // para dar para escolher o mesmo arquivo de novo
    if (!arquivo) return;

    const erro = erroArquivo(arquivo, lista.length);
    setAviso(erro);
    if (erro) return;

    // Pet novo: só guarda na lista; sobe quando salvar o pet
    if (!petId) {
      aoMudarPendentes([...pendentes, arquivo]);
      return;
    }

    setEnviando(true);
    const { error } = await documentos.upload(caminhoCarteirinha(tutorId, petId, arquivo), arquivo, {
      contentType: tipoDoArquivo(arquivo),
    });
    setEnviando(false);
    if (error) {
      setAviso("Não foi possível anexar. Tente de novo.");
      return;
    }
    setVersao((v) => v + 1);
  }

  async function remover(linha) {
    setAviso("");
    // Pet novo: só tira da lista (o arquivo ainda não subiu)
    if (!petId) {
      aoMudarPendentes(pendentes.filter((_, indice) => indice !== linha.indice));
      return;
    }
    // data vazio sem erro = a regra bloqueou ou o arquivo já não existia
    const { data, error } = await documentos.remove([linha.caminho]);
    if (error || !data?.length) {
      setAviso("Não foi possível remover. Tente de novo.");
      return;
    }
    setVersao((v) => v + 1);
  }

  // Pasta privada: pede um link que vale 60 segundos e abre numa aba nova.
  // A aba abre antes de esperar o link, senão o celular bloqueia como pop-up.
  async function abrir(linha) {
    const aba = window.open("", "_blank");
    const { data, error } = await documentos.createSignedUrl(linha.caminho, 60);
    if (error) {
      aba?.close();
      setAviso("Não foi possível abrir o arquivo.");
      return;
    }
    if (aba) aba.location.href = data.signedUrl;
  }

  // No perfil do pet, sem nenhum arquivo, não mostra nada
  if (!editar && linhas.length === 0 && !aviso) return null;

  return (
    <div className="carteirinha">
      <span className="carteirinha-titulo">Carteirinha de vacinação</span>

      {lista.map((linha) => (
        <div key={linha.nome} className="carteirinha-linha">
          {/* Pet novo: o arquivo ainda não subiu, então não tem como abrir */}
          <button
            type="button"
            className="carteirinha-abrir"
            disabled={!petId}
            onClick={() => abrir(linha)}
          >
            <span className="carteirinha-icone">
              {linha.pdf ? <IoDocumentTextOutline /> : <IoImageOutline />}
            </span>
            <span className="carteirinha-textos">
              <strong>{linha.nome}</strong>
              <span>{linha.detalhe}</span>
            </span>
            {!editar && <IoChevronForward className="carteirinha-seta" />}
          </button>
          {editar && (
            <button
              type="button"
              className="lista-mais-remover"
              aria-label={`Remover ${linha.nome}`}
              onClick={() => remover(linha)}
            >
              <IoTrashOutline />
            </button>
          )}
        </div>
      ))}

      {editar && lista.length < LIMITE_ARQUIVOS && (
        <>
          <button
            type="button"
            className="lista-mais-adicionar"
            disabled={enviando}
            onClick={() => campoArquivo.current.click()}
          >
            {enviando ? "Anexando..." : "+ Anexar carteirinha"}
          </button>
          <input
            ref={campoArquivo}
            type="file"
            accept="image/*,.heic,.heif,application/pdf"
            hidden
            onChange={anexar}
          />
          <span className="carteirinha-dica">Foto ou PDF, até 10 MB cada. Até 10 arquivos.</span>
        </>
      )}

      {aviso && <span className="aviso-cpf">{aviso}</span>}
    </div>
  );
}
