import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoCameraOutline } from "react-icons/io5";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import AjustarFoto from "../componentes/AjustarFoto.jsx";
import { supabase } from "../supabaseClient.js";
import { abrirFotoEscolhida, AVISO_FOTO } from "../fotos.js";
import { temCadastro, linkCompletarCadastro } from "../perfil.js";
import { SelectCostumizado } from "./Mural.jsx/SelectCostumizado.jsx";
import CamposEndereco from "../componentes/CamposEndereco.jsx";
import {
  formatarData,
  validarData,
  paraDataISO,
  deDataISO,
  camposVazios,
} from "../formatadores.js";
import "./Mural.jsx/mural.css";
import "./login.css";
import "./animais.css"; // círculo da foto (o mesmo do cadastro do pet)
import "./meuperfil.css";

export default function MeuPerfil() {
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState({
    rua: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    pais: "",
  });

  // Foto de perfil: a atual (link), a nova escolhida (arquivo) e a que está sendo ajustada
  const [fotoUrl, setFotoUrl] = useState(null);
  const [fotoNova, setFotoNova] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoParaAjustar, setFotoParaAjustar] = useState(null);
  const [erroFoto, setErroFoto] = useState("");
  // Foto do iPhone (HEIC) demora uns segundos para converter
  const [abrindoFoto, setAbrindoFoto] = useState(false);

  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  // Só depois de clicar em "Salvar alterações" os campos vazios ficam vermelhos
  const [tentouEnviar, setTentouEnviar] = useState(false);

  // Campos obrigatórios (só o Complemento fica de fora).
  // O CPF não entra: aqui ele está travado, a pessoa não consegue preencher
  const vazios = camposVazios({
    nome,
    sobrenome,
    dataNascimento,
    sexo,
    cep,
    rua: endereco.rua,
    numero: endereco.numero,
    cidade: endereco.cidade,
    estado: endereco.estado,
    pais: endereco.pais,
  });

  // Devolve "campo-invalido" (borda vermelha, do login.css) para o campo vazio,
  // mas só depois da tentativa de salvar
  function borda(campo) {
    return tentouEnviar && vazios.includes(campo) ? "campo-invalido" : "";
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { state: { voltarPara: "/meu-perfil" } });
        return;
      }

      const { data: tutor, error } = await supabase
        .from("tutores")
        .select(
          "nome, sobrenome, cpf, data_nascimento, sexo, cep, rua, numero, complemento, cidade, estado, pais, foto_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setErro("Não foi possível carregar os seus dados. Tente de novo.");
        setCarregando(false);
        return;
      }

      if (!tutor) {
        // Profissional não tem linha em "tutores". Mandar para o Completar
        // cadastro criaria um vaivém sem fim (ele devolveria para cá).
        if (await temCadastro(user.id)) {
          setErro("Por enquanto, o Meu perfil só está pronto para tutores.");
          setCarregando(false);
          return;
        }

        navigate(linkCompletarCadastro("/meu-perfil"));
        return;
      }

      setUsuario(user);
      setFotoUrl(tutor.foto_url || null);
      setFotoPreview(tutor.foto_url || null);
      setNome(tutor.nome || "");
      setSobrenome(tutor.sobrenome || "");
      setCpf(tutor.cpf || "");
      setDataNascimento(deDataISO(tutor.data_nascimento));
      setSexo(tutor.sexo || "");
      setCep(tutor.cep || "");
      setEndereco({
        rua: tutor.rua || "",
        numero: tutor.numero || "",
        complemento: tutor.complemento || "",
        cidade: tutor.cidade || "",
        estado: tutor.estado || "",
        pais: tutor.pais || "",
      });
      setCarregando(false);
    }

    iniciar();
  }, []);

  function mudarEndereco(campo, valor) {
    setEndereco((anterior) => ({ ...anterior, [campo]: valor }));
    setSalvo(false);
  }

  async function escolherFoto(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = ""; // para dar para escolher a mesma foto de novo
    if (!arquivo) return;
    setErroFoto("");
    setAbrindoFoto(true);
    try {
      setFotoParaAjustar(await abrirFotoEscolhida(arquivo));
    } catch (falha) {
      console.error(falha);
      setErroFoto(AVISO_FOTO); // aparece logo embaixo da foto
    } finally {
      setAbrindoFoto(false);
    }
  }

  function usarFotoAjustada(arquivoRecortado) {
    setFotoNova(arquivoRecortado);
    setFotoPreview(URL.createObjectURL(arquivoRecortado));
    setFotoParaAjustar(null);
    setSalvo(false);
  }

  // Envia a foto nova para a pasta "fotos-perfil" e devolve o link (ou null se der erro).
  // O nome do arquivo é aleatório, para ninguém conseguir adivinhar o link.
  async function enviarFoto() {
    const caminho = `${usuario.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("fotos-perfil")
      .upload(caminho, fotoNova, { contentType: "image/jpeg" });

    if (error) {
      console.error(error);
      return null;
    }

    return supabase.storage.from("fotos-perfil").getPublicUrl(caminho).data.publicUrl;
  }

  // Apaga uma foto da pasta (a antiga, depois de trocar, ou a nova, se o cadastro não salvou)
  async function apagarFotoAntiga(link) {
    const caminho = link?.split("/fotos-perfil/")[1];
    if (!caminho) return;
    const { error } = await supabase.storage.from("fotos-perfil").remove([caminho]);
    if (error) console.error(error); // não atrapalha: a foto nova já foi salva
  }

  async function salvar() {
    setErro("");
    setSalvo(false);
    setTentouEnviar(true);

    if (vazios.length > 0) {
      setErro("Preencha os campos em vermelho.");
      return;
    }

    const erroData = validarData(dataNascimento);
    if (erroData) {
      setErro(erroData);
      return;
    }

    setSalvando(true);

    let novoLinkFoto = fotoUrl;
    if (fotoNova) {
      novoLinkFoto = await enviarFoto();
      if (!novoLinkFoto) {
        setSalvando(false);
        setErro("Não foi possível enviar a foto. Tente de novo.");
        return;
      }
    }

    const { data: alterados, error } = await supabase
      .from("tutores")
      .update({
        nome,
        sobrenome,
        data_nascimento: paraDataISO(dataNascimento),
        sexo,
        cep,
        rua: endereco.rua,
        numero: endereco.numero,
        complemento: endereco.complemento,
        cidade: endereco.cidade,
        estado: endereco.estado,
        pais: endereco.pais,
        foto_url: novoLinkFoto,
      })
      .eq("id", usuario.id)
      .select("id");

    setSalvando(false);

    // Sem erro mas sem linha alterada = o banco bloqueou (falta a regra de UPDATE)
    if (error || !alterados?.length) {
      setErro("Não foi possível salvar. Tente de novo.");
      console.error(error || "Nenhuma linha alterada em tutores (regra de segurança?)");
      // A foto nova foi enviada, mas o cadastro não salvou: apaga para não sobrar arquivo perdido
      if (fotoNova && novoLinkFoto) await apagarFotoAntiga(novoLinkFoto);
      return;
    }

    // Foto trocada com sucesso: apaga a antiga
    if (fotoNova && fotoUrl) await apagarFotoAntiga(fotoUrl);
    setFotoUrl(novoLinkFoto);
    setFotoNova(null);
    setSalvo(true);
  }

  if (carregando) {
    return null;
  }

  if (!usuario) {
    return (
      <div className="meu-perfil">
        <header className="topo-com-voltar">
          <BotaoVoltar
            descricao="Voltar para a tela inicial"
            aoClicar={() => navigate("/")}
          />
          <h1 className="meu-perfil-titulo">Meu perfil</h1>
        </header>
        <span className="aviso-cpf">{erro}</span>
      </div>
    );
  }

  return (
    <div className="meu-perfil">
      <header className="topo-com-voltar">
        <BotaoVoltar
          descricao="Voltar para a tela inicial"
          aoClicar={() => navigate("/")}
        />
        <h1 className="meu-perfil-titulo">Meu perfil</h1>
      </header>

      <div className="login-form">
        {/* Foto de perfil: o círculo inteiro é o botão (igual ao cadastro do pet) */}
        <label className="pet-foto-circulo">
          <input
            type="file"
            accept="image/*"
            onChange={escolherFoto}
            disabled={abrindoFoto}
            className="pet-foto-input"
          />
          {fotoPreview ? (
            <img src={fotoPreview} alt="Sua foto de perfil" className="pet-foto-imagem" />
          ) : (
            <span className="pet-foto-vazia">
              <IoCameraOutline />
            </span>
          )}
          <span className="pet-foto-texto">
            {abrindoFoto
              ? "Abrindo foto..."
              : fotoPreview
                ? "Trocar foto"
                : "Adicionar foto (opcional)"}
          </span>
        </label>
        {erroFoto && <span className="aviso-cpf">{erroFoto}</span>}

        {fotoParaAjustar && (
          <AjustarFoto
            imagem={fotoParaAjustar}
            aoConfirmar={usarFotoAjustada}
            aoCancelar={() => setFotoParaAjustar(null)}
          />
        )}

        <p className="obrigatorio-legenda">
          <span className="obrigatorio">*</span> Campos obrigatórios
        </p>

        <h3 className="login-secao-titulo">Dados pessoais</h3>

        <label>
          <span>
            Nome <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setSalvo(false);
            }}
            className={borda("nome")}
          />
        </label>

        <label>
          <span>
            Sobrenome <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            value={sobrenome}
            onChange={(e) => {
              setSobrenome(e.target.value);
              setSalvo(false);
            }}
            className={borda("sobrenome")}
          />
        </label>

        <label>
          CPF
          <input type="text" value={cpf} disabled />
          <span className="dica-campo">
            O CPF não pode ser alterado por aqui.
          </span>
        </label>

        <label>
          <span>
            Data de nascimento <span className="obrigatorio">*</span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            value={dataNascimento}
            onChange={(e) => {
              setDataNascimento(formatarData(e.target.value));
              setSalvo(false);
            }}
            className={borda("dataNascimento")}
          />
        </label>

        <label>
          <span>
            Sexo <span className="obrigatorio">*</span>
          </span>
          <SelectCostumizado
            label="Selecione"
            opcoes={["Feminino", "Masculino", "Outro"]}
            valor={sexo}
            aoEscolher={(valor) => {
              setSexo(valor);
              setSalvo(false);
            }}
            invalido={tentouEnviar && vazios.includes("sexo")}
          />
        </label>

        <h3 className="login-secao-titulo">Endereço</h3>

        <CamposEndereco
          cep={cep}
          aoMudarCep={(valor) => {
            setCep(valor);
            setSalvo(false);
          }}
          endereco={endereco}
          aoMudarEndereco={mudarEndereco}
          borda={borda}
        />

        {erro && <span className="aviso-cpf">{erro}</span>}
        {salvo && <span className="meu-perfil-salvo">Dados salvos!</span>}

        <button className="botao-login" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
