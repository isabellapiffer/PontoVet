import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { mensagemDeErro } from "../erros.js";
import { SelectCostumizado } from "./Mural.jsx/SelectCostumizado.jsx";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import CamposEndereco from "../componentes/CamposEndereco.jsx";
import { ufs } from "../endereco.js";
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarData,
  paraDataISO,
  validarData,
  camposVazios,
} from "../formatadores.js";
import "./Mural.jsx/mural.css";
import "./login.css";

export default function CompletarCadastro() {
  const [passo, setPasso] = useState("carregando");
  const [usuario, setUsuario] = useState(null);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfExiste, setCpfExiste] = useState(false);
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");

  const [tipoProfissional, setTipoProfissional] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [crmv, setCrmv] = useState("");
  const [crmvUf, setCrmvUf] = useState("");
  const [crmvExiste, setCrmvExiste] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cnpjExiste, setCnpjExiste] = useState(false);
  const [cpfProf, setCpfProf] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [dataNascimentoProf, setDataNascimentoProf] = useState("");

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState({
    rua: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
  });

  const [erro, setErro] = useState("");
  // Só depois de clicar em "Concluir cadastro" os campos vazios ficam vermelhos
  const [tentouEnviar, setTentouEnviar] = useState(false);
  // true enquanto o cadastro está sendo salvo no Supabase (evita clique duplo)
  const [enviando, setEnviando] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const voltarPara = searchParams.get("voltar") || "/";
  const categoriaPreDefinida = searchParams.get("categoria");
  const tipoPreDefinido = searchParams.get("tipo");

  // Endereço: obrigatório nos dois formulários (só o Complemento fica de fora)
  const enderecoObrigatorio = {
    cep,
    rua: endereco.rua,
    numero: endereco.numero,
    cidade: endereco.cidade,
    estado: endereco.estado,
    pais: endereco.pais,
  };

  // Campos obrigatórios do tutor
  const vaziosTutor = camposVazios({
    nome,
    sobrenome,
    cpf,
    dataNascimento,
    sexo,
    ...enderecoObrigatorio,
  });

  // Campos obrigatórios do profissional: os comuns aos dois tipos...
  const obrigatoriosProf = {
    nomeCompleto,
    cpfProf,
    crmv,
    crmvUf,
    whatsapp,
    ...enderecoObrigatorio,
  };
  // ...mais os de cada tipo (no autônomo, o CNPJ é opcional)
  if (tipoProfissional === "autonomo") {
    obrigatoriosProf.dataNascimentoProf = dataNascimentoProf;
  }
  if (tipoProfissional === "estabelecimento") {
    obrigatoriosProf.nomeFantasia = nomeFantasia;
    obrigatoriosProf.razaoSocial = razaoSocial;
    obrigatoriosProf.proprietario = proprietario;
    obrigatoriosProf.cnpj = cnpj;
  }
  const vaziosProf = camposVazios(obrigatoriosProf);

  // O formulário que está na tela decide qual lista vale
  const vazios = passo === "formTutor" ? vaziosTutor : vaziosProf;

  // Devolve "campo-invalido" (borda vermelha, do login.css) para o campo vazio,
  // mas só depois da tentativa de concluir o cadastro
  function borda(campo) {
    return tentouEnviar && vazios.includes(campo) ? "campo-invalido" : "";
  }

  useEffect(() => {
    async function conferir() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        navigate("/login");
        return;
      }

      setUsuario(data.user);

      const { data: tutor } = await supabase
        .from("tutores")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      const { data: profissional } = await supabase
        .from("profissionais")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (tutor || profissional) {
        navigate(voltarPara);
        return;
      }

      if (categoriaPreDefinida === "tutor") {
        setPasso("formTutor");
      } else if (categoriaPreDefinida === "profissional") {
        setTipoProfissional(tipoPreDefinido);
        setPasso("formProfissional");
      } else {
        setPasso("categoria");
      }
    }

    conferir();
  }, []);

  function voltar() {
    // Saindo do formulário, o vermelho e o aviso não ficam para a próxima vez
    setTentouEnviar(false);
    setErro("");
    if (passo === "tipoProfissional") setPasso("categoria");
    if (passo === "formTutor") setPasso("categoria");
    if (passo === "formProfissional") setPasso("tipoProfissional");
  }

  // Usada pelos campos de endereço: ex.: mudarEndereco("cidade", "Itajaí")
  function mudarEndereco(campo, valor) {
    setEndereco((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function verificarCpf() {
    if (!cpf) return;
    const { data } = await supabase.rpc("cpf_existe", { cpf_busca: cpf });
    setCpfExiste(Boolean(data));
  }

  async function verificarCrmv(ufEscolhida) {
    const uf = ufEscolhida || crmvUf;
    if (!crmv || !uf) return;

    const { data } = await supabase.rpc("crmv_existe", {
      crmv_busca: crmv,
      uf_busca: uf,
    });
    setCrmvExiste(Boolean(data));
  }

  async function verificarCnpj() {
    if (!cnpj) return;
    const { data } = await supabase.rpc("cnpj_existe", { cnpj_busca: cnpj });
    setCnpjExiste(Boolean(data));
  }

  async function salvarTutor() {
    // Se já está salvando, ignora o segundo clique
    if (enviando) return;

    setErro("");
    setTentouEnviar(true);

    if (vaziosTutor.length > 0) {
      setErro("Preencha os campos em vermelho.");
      return;
    }

    if (cpfExiste) {
      setErro("Esse CPF já está cadastrado.");
      return;
    }

    const erroData = validarData(dataNascimento);
    if (erroData) {
      setErro(erroData);
      return;
    }

    // Os campos estão certos: agora sim o botão fica desativado
    setEnviando(true);

    const { error } = await supabase.from("tutores").insert({
      id: usuario.id,
      nome,
      sobrenome,
      cpf,
      data_nascimento: paraDataISO(dataNascimento),
      sexo,
      cep,
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento,
      cidade: endereco.cidade,
      estado: endereco.estado,
      pais: endereco.pais,
    });

    if (error) {
      setErro(mensagemDeErro(error));
      setEnviando(false);
      return;
    }

    navigate(voltarPara);
  }

  async function salvarProfissional() {
    // Se já está salvando, ignora o segundo clique
    if (enviando) return;

    setErro("");
    setTentouEnviar(true);

    if (vaziosProf.length > 0) {
      setErro("Preencha os campos em vermelho.");
      return;
    }

    if (crmvExiste) {
      setErro("Esse CRMV já está cadastrado.");
      return;
    }

    if (cnpjExiste) {
      setErro("Esse CNPJ já está cadastrado.");
      return;
    }

    if (tipoProfissional === "autonomo") {
      const erroData = validarData(dataNascimentoProf);
      if (erroData) {
        setErro(erroData);
        return;
      }
    }

    // Os campos estão certos: agora sim o botão fica desativado
    setEnviando(true);

    const { error } = await supabase.from("profissionais").insert({
      id: usuario.id,
      tipo: tipoProfissional,
      nome_completo: nomeCompleto,
      crmv,
      crmv_uf: crmvUf,
      whatsapp,
      cnpj: cnpj || null,
      cpf: cpfProf,
      nome_fantasia:
        tipoProfissional === "estabelecimento" ? nomeFantasia : null,
      razao_social:
        tipoProfissional === "estabelecimento" ? razaoSocial : null,
      proprietario:
        tipoProfissional === "estabelecimento" ? proprietario : null,
      data_nascimento:
        tipoProfissional === "autonomo"
          ? paraDataISO(dataNascimentoProf)
          : null,
      cep,
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento,
      cidade: endereco.cidade,
      estado: endereco.estado,
      pais: endereco.pais,
    });

    if (error) {
      setErro(mensagemDeErro(error));
      setEnviando(false);
      return;
    }

    navigate(voltarPara);
  }

  if (passo === "carregando") {
    return (
      <div className="login-pagina">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="login-pagina">
      {passo !== "categoria" && (
        <div className="topo-com-voltar">
          <BotaoVoltar aoClicar={voltar} />
        </div>
      )}

      <img src="/logopontovet.png" alt="PontoVet" className="login-logo" />

      <p className="dica-campo">
        Falta pouco! Complete seu cadastro pra continuar.
      </p>

      {passo === "categoria" && (
        <div className="login-opcoes">
          <button onClick={() => setPasso("formTutor")}>Sou tutor</button>
          <button onClick={() => setPasso("tipoProfissional")}>
            Sou profissional
          </button>
        </div>
      )}

      {passo === "tipoProfissional" && (
        <div className="login-opcoes">
          <button
            onClick={() => {
              setTipoProfissional("autonomo");
              setPasso("formProfissional");
            }}
          >
            Médico veterinário autônomo
          </button>
          <button
            onClick={() => {
              setTipoProfissional("estabelecimento");
              setPasso("formProfissional");
            }}
          >
            Clínica veterinária
          </button>
        </div>
      )}

      {passo === "formTutor" && (
        <div className="login-form">
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
              onChange={(e) => setNome(e.target.value)}
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
              onChange={(e) => setSobrenome(e.target.value)}
              className={borda("sobrenome")}
            />
          </label>

          <label>
            <span>
              CPF <span className="obrigatorio">*</span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              maxLength={14}
              value={cpf}
              onChange={(e) => {
                setCpf(formatarCpf(e.target.value));
                setCpfExiste(false);
              }}
              onBlur={verificarCpf}
              className={borda("cpf")}
            />
            {cpfExiste && (
              <span className="aviso-cpf">Esse CPF já está cadastrado.</span>
            )}
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
              onChange={(e) => setDataNascimento(formatarData(e.target.value))}
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
              aoEscolher={(valor) => setSexo(valor)}
              invalido={tentouEnviar && vazios.includes("sexo")}
            />
          </label>

          <h3 className="login-secao-titulo">Endereço</h3>

          <CamposEndereco
            cep={cep}
            aoMudarCep={setCep}
            endereco={endereco}
            aoMudarEndereco={mudarEndereco}
            borda={borda}
          />

          {erro && <span className="aviso-cpf">{erro}</span>}

          <button
            className="botao-login"
            onClick={salvarTutor}
            disabled={enviando}
          >
            {enviando ? "Salvando..." : "Concluir cadastro"}
          </button>
        </div>
      )}

      {passo === "formProfissional" && (
        <div className="login-form">
          <p className="obrigatorio-legenda">
            <span className="obrigatorio">*</span> Campos obrigatórios
          </p>

          {tipoProfissional === "autonomo" && (
            <>
              <h3 className="login-secao-titulo">Dados pessoais</h3>

              <label>
                <span>
                  Nome completo <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className={borda("nomeCompleto")}
                />
              </label>

              <label>
                <span>
                  CPF <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={cpfProf}
                  onChange={(e) => setCpfProf(formatarCpf(e.target.value))}
                  className={borda("cpfProf")}
                />
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
                  value={dataNascimentoProf}
                  onChange={(e) =>
                    setDataNascimentoProf(formatarData(e.target.value))
                  }
                  className={borda("dataNascimentoProf")}
                />
              </label>

              <h3 className="login-secao-titulo">Dados profissionais</h3>

              <label>
                <span>
                  CRMV <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Só números"
                  maxLength={6}
                  value={crmv}
                  onChange={(e) => {
                    setCrmv(e.target.value.replace(/\D/g, ""));
                    setCrmvExiste(false);
                  }}
                  onBlur={() => verificarCrmv()}
                  className={borda("crmv")}
                />
              </label>

              <label>
                <span>
                  Estado de emissão (UF) <span className="obrigatorio">*</span>
                </span>
                <SelectCostumizado
                  label="Selecione"
                  opcoes={ufs}
                  valor={crmvUf}
                  aoEscolher={(valor) => {
                    setCrmvUf(valor);
                    setCrmvExiste(false);
                    verificarCrmv(valor);
                  }}
                  invalido={tentouEnviar && vazios.includes("crmvUf")}
                />
                {crmvExiste && (
                  <span className="aviso-cpf">
                    Esse CRMV já está cadastrado.
                  </span>
                )}
              </label>

              <label>
                <span>
                  WhatsApp <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="(11) 91234-5678"
                  maxLength={15}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
                  className={borda("whatsapp")}
                />
              </label>

              <label>
                CNPJ (opcional)
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  value={cnpj}
                  onChange={(e) => {
                    setCnpj(formatarCnpj(e.target.value));
                    setCnpjExiste(false);
                  }}
                  onBlur={verificarCnpj}
                />
                {cnpjExiste && (
                  <span className="aviso-cpf">
                    Esse CNPJ já está cadastrado.
                  </span>
                )}
              </label>

              <h3 className="login-secao-titulo">Endereço</h3>
            </>
          )}

          {tipoProfissional === "estabelecimento" && (
            <>
              <h3 className="login-secao-titulo">
                Dados do responsável técnico
              </h3>

              <label>
                <span>
                  Nome <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className={borda("nomeCompleto")}
                />
              </label>

              <label>
                <span>
                  CRMV <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Só números"
                  maxLength={6}
                  value={crmv}
                  onChange={(e) => {
                    setCrmv(e.target.value.replace(/\D/g, ""));
                    setCrmvExiste(false);
                  }}
                  onBlur={() => verificarCrmv()}
                  className={borda("crmv")}
                />
              </label>

              <label>
                <span>
                  Estado de emissão (UF) <span className="obrigatorio">*</span>
                </span>
                <SelectCostumizado
                  label="Selecione"
                  opcoes={ufs}
                  valor={crmvUf}
                  aoEscolher={(valor) => {
                    setCrmvUf(valor);
                    setCrmvExiste(false);
                    verificarCrmv(valor);
                  }}
                  invalido={tentouEnviar && vazios.includes("crmvUf")}
                />
                {crmvExiste && (
                  <span className="aviso-cpf">
                    Esse CRMV já está cadastrado.
                  </span>
                )}
              </label>

              <label>
                <span>
                  CPF <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={cpfProf}
                  onChange={(e) => setCpfProf(formatarCpf(e.target.value))}
                  className={borda("cpfProf")}
                />
              </label>

              <label>
                <span>
                  WhatsApp <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="(11) 91234-5678"
                  maxLength={15}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
                  className={borda("whatsapp")}
                />
              </label>

              <h3 className="login-secao-titulo">Dados do estabelecimento</h3>

              <label>
                <span>
                  Nome fantasia <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className={borda("nomeFantasia")}
                />
              </label>

              <label>
                <span>
                  Razão social <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className={borda("razaoSocial")}
                />
              </label>

              <label>
                <span>
                  Proprietário <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  value={proprietario}
                  onChange={(e) => setProprietario(e.target.value)}
                  className={borda("proprietario")}
                />
              </label>

              <label>
                <span>
                  CNPJ <span className="obrigatorio">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  value={cnpj}
                  onChange={(e) => {
                    setCnpj(formatarCnpj(e.target.value));
                    setCnpjExiste(false);
                  }}
                  onBlur={verificarCnpj}
                  className={borda("cnpj")}
                />
                {cnpjExiste && (
                  <span className="aviso-cpf">
                    Esse CNPJ já está cadastrado.
                  </span>
                )}
              </label>
            </>
          )}

          <CamposEndereco
            cep={cep}
            aoMudarCep={setCep}
            endereco={endereco}
            aoMudarEndereco={mudarEndereco}
            borda={borda}
          />

          {erro && <span className="aviso-cpf">{erro}</span>}

          <button
            className="botao-login"
            onClick={salvarProfissional}
            disabled={enviando}
          >
            {enviando ? "Salvando..." : "Concluir cadastro"}
          </button>
        </div>
      )}
    </div>
  );
}
