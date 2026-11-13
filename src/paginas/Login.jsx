import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { mensagemDeErro } from "../erros.js";
import { linkCompletarCadastro } from "../perfil.js";
import BotaoVoltar from "../componentes/BotaoVoltar.jsx";
import { SelectCostumizado } from "./Mural.jsx/SelectCostumizado.jsx";
import CamposEndereco from "../componentes/CamposEndereco.jsx";
import { ufs } from "../endereco.js";
import {
  requisitosSenha,
  validarSenha,
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

export default function Login() {
  const [passo, setPasso] = useState("entrar");

  const [emailEntrar, setEmailEntrar] = useState("");
  const [senhaEntrar, setSenhaEntrar] = useState("");
  const [mostrarSenhaEntrar, setMostrarSenhaEntrar] = useState(false);
  const [erroEntrar, setErroEntrar] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfExiste, setCpfExiste] = useState(false);
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState({
    rua: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
  });
  const [erroCadastro, setErroCadastro] = useState("");
  // Só depois de clicar em "Criar conta" os campos vazios ficam vermelhos
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const [tipoProfissional, setTipoProfissional] = useState("");
  const [emailProf, setEmailProf] = useState("");
  const [senhaProf, setSenhaProf] = useState("");
  const [mostrarSenhaProf, setMostrarSenhaProf] = useState(false);
  const [confirmarSenhaProf, setConfirmarSenhaProf] = useState("");
  const [mostrarConfirmarSenhaProf, setMostrarConfirmarSenhaProf] =
    useState(false);
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
  const [cepProf, setCepProf] = useState("");
  const [enderecoProf, setEnderecoProf] = useState({
    rua: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
  });
  const [erroCadastroProf, setErroCadastroProf] = useState("");
  const [tentouEnviarProf, setTentouEnviarProf] = useState(false);
  // true enquanto a conta está sendo criada no Supabase (evita clique duplo)
  const [enviando, setEnviando] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const voltarPara = location.state?.voltarPara || "/";

  // Campos obrigatórios do tutor (só o Complemento fica de fora)
  const vaziosTutor = camposVazios({
    email,
    senha,
    confirmarSenha,
    nome,
    sobrenome,
    cpf,
    dataNascimento,
    sexo,
    cep,
    rua: endereco.rua,
    numero: endereco.numero,
    cidade: endereco.cidade,
    estado: endereco.estado,
    pais: endereco.pais,
  });

  // Campos obrigatórios do profissional: os comuns aos dois tipos...
  const obrigatoriosProf = {
    emailProf,
    senhaProf,
    confirmarSenhaProf,
    nomeCompleto,
    cpfProf,
    crmv,
    crmvUf,
    whatsapp,
    cepProf,
    rua: enderecoProf.rua,
    numero: enderecoProf.numero,
    cidade: enderecoProf.cidade,
    estado: enderecoProf.estado,
    pais: enderecoProf.pais,
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

  // Devolve "campo-invalido" (borda vermelha, do login.css) para o campo vazio,
  // mas só depois da tentativa de criar a conta
  function bordaTutor(campo) {
    return tentouEnviar && vaziosTutor.includes(campo) ? "campo-invalido" : "";
  }

  function bordaProf(campo) {
    return tentouEnviarProf && vaziosProf.includes(campo)
      ? "campo-invalido"
      : "";
  }

  function voltar() {
    // Saindo do formulário, o vermelho e o aviso não ficam para a próxima vez
    setTentouEnviar(false);
    setTentouEnviarProf(false);
    setErroCadastro("");
    setErroCadastroProf("");

    if (passo === "categoria") setPasso("entrar");
    if (passo === "tipoProfissional") setPasso("categoria");
    if (passo === "formTutor") setPasso("categoria");
    if (passo === "formProfissional") setPasso("tipoProfissional");
  }

  async function entrar() {
    setErroEntrar("");

    const { error } = await supabase.auth.signInWithPassword({
      email: emailEntrar,
      password: senhaEntrar,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setErroEntrar(
          "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada (e o spam)."
        );
      } else {
        setErroEntrar("E-mail ou senha incorretos.");
      }
      return;
    }

    // Passa pela tela Completar cadastro: se faltar o cadastro, ela mostra o
    // formulário; se já tiver, ela leva direto para o voltarPara.
    navigate(linkCompletarCadastro(voltarPara));
  }

  async function loginComGoogle(categoria, tipo) {
    let url =
      window.location.origin +
      "/completar-cadastro?voltar=" +
      encodeURIComponent(voltarPara);

    if (categoria) url += "&categoria=" + categoria;
    if (tipo) url += "&tipo=" + tipo;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: url,
      },
    });
  }

  async function verificarCpf() {
    if (!cpf) return;

    const { data } = await supabase.rpc("cpf_existe", { cpf_busca: cpf });
    setCpfExiste(Boolean(data));
  }

  async function criarConta() {
    // Se já está criando a conta, ignora o segundo clique
    if (enviando) return;

    setErroCadastro("");
    setTentouEnviar(true);

    if (vaziosTutor.length > 0) {
      setErroCadastro("Preencha os campos em vermelho.");
      return;
    }

    if (!validarSenha(senha)) {
      setErroCadastro("A senha não atende aos requisitos mínimos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErroCadastro("As senhas não coincidem.");
      return;
    }

    if (cpfExiste) {
      setErroCadastro("Esse CPF já está cadastrado.");
      return;
    }

    const erroData = validarData(dataNascimento);
    if (erroData) {
      setErroCadastro(erroData);
      return;
    }

    // Os campos estão certos: agora sim o botão fica desativado
    setEnviando(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setErroCadastro(mensagemDeErro(error));
      setEnviando(false);
      return;
    }

    const { error: erroTutor } = await supabase.from("tutores").insert({
      id: data.user.id,
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

    if (erroTutor) {
      setErroCadastro(mensagemDeErro(erroTutor));
      setEnviando(false);
      return;
    }

    navigate(voltarPara);
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

  async function criarContaProfissional() {
    // Se já está criando a conta, ignora o segundo clique
    if (enviando) return;

    setErroCadastroProf("");
    setTentouEnviarProf(true);

    if (vaziosProf.length > 0) {
      setErroCadastroProf("Preencha os campos em vermelho.");
      return;
    }

    if (!validarSenha(senhaProf)) {
      setErroCadastroProf("A senha não atende aos requisitos mínimos.");
      return;
    }

    if (senhaProf !== confirmarSenhaProf) {
      setErroCadastroProf("As senhas não coincidem.");
      return;
    }

    if (crmvExiste) {
      setErroCadastroProf("Esse CRMV já está cadastrado.");
      return;
    }

    if (cnpjExiste) {
      setErroCadastroProf("Esse CNPJ já está cadastrado.");
      return;
    }

    if (tipoProfissional === "autonomo") {
      const erroData = validarData(dataNascimentoProf);
      if (erroData) {
        setErroCadastroProf(erroData);
        return;
      }
    }

    // Os campos estão certos: agora sim o botão fica desativado
    setEnviando(true);

    const { data, error } = await supabase.auth.signUp({
      email: emailProf,
      password: senhaProf,
    });

    if (error) {
      setErroCadastroProf(mensagemDeErro(error));
      setEnviando(false);
      return;
    }

    const { error: erroProf } = await supabase.from("profissionais").insert({
      id: data.user.id,
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
      cep: cepProf,
      rua: enderecoProf.rua,
      numero: enderecoProf.numero,
      complemento: enderecoProf.complemento,
      cidade: enderecoProf.cidade,
      estado: enderecoProf.estado,
      pais: enderecoProf.pais,
    });

    if (erroProf) {
      setErroCadastroProf(mensagemDeErro(erroProf));
      setEnviando(false);
      return;
    }

    navigate(voltarPara);
  }

  return (
    <div className="login-pagina">
      {passo !== "entrar" && (
        <div className="topo-com-voltar">
          <BotaoVoltar aoClicar={voltar} />
        </div>
      )}

      <img src="/logopontovet.png" alt="PontoVet" className="login-logo" />

      {passo === "entrar" && (
        <div className="login-form">
          <button className="botao-google" onClick={() => loginComGoogle()}>
            <i className="fa-brands fa-google"></i> Entrar com Google
          </button>
          <span className="divisor-ou">ou entre com e-mail</span>

          <label>
            E-mail
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={emailEntrar}
              onChange={(e) => setEmailEntrar(e.target.value)}
            />
          </label>
          <label>
            Senha
            <div className="campo-senha">
              <input
                type={mostrarSenhaEntrar ? "text" : "password"}
                placeholder="Sua senha"
                value={senhaEntrar}
                onChange={(e) => setSenhaEntrar(e.target.value)}
              />
              <i
                className={`fa-solid ${
                  mostrarSenhaEntrar ? "fa-eye-slash" : "fa-eye"
                } icone-olho`}
                onClick={() => setMostrarSenhaEntrar(!mostrarSenhaEntrar)}
              ></i>
            </div>
          </label>

          {erroEntrar && <span className="aviso-cpf">{erroEntrar}</span>}

          <button className="botao-login" onClick={entrar}>
            Entrar
          </button>

          <span className="link-esqueceu">Esqueceu seu login/senha?</span>

          <button
            className="botao-criar-conta"
            onClick={() => setPasso("categoria")}
          >
            Criar conta
          </button>
        </div>
      )}

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
          <button
            className="botao-google"
            onClick={() => loginComGoogle("tutor")}
          >
            <i className="fa-brands fa-google"></i> Entrar com Google
          </button>
          <span className="divisor-ou">ou crie sua conta com e-mail</span>

          <p className="obrigatorio-legenda">
            <span className="obrigatorio">*</span> Campos obrigatórios
          </p>

          <label>
            <span>
              E-mail <span className="obrigatorio">*</span>
            </span>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={bordaTutor("email")}
            />
          </label>

          <label>
            <span>
              Senha <span className="obrigatorio">*</span>
            </span>
            <div className="campo-senha">
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Crie uma senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={
                  senha.length === 0
                    ? bordaTutor("senha")
                    : validarSenha(senha)
                    ? "campo-valido"
                    : "campo-invalido"
                }
              />
              <i
                className={`fa-solid ${
                  mostrarSenha ? "fa-eye-slash" : "fa-eye"
                } icone-olho`}
                onClick={() => setMostrarSenha(!mostrarSenha)}
              ></i>
            </div>
            {senha.length > 0 && (
              <div className="requisitos-senha">
                {requisitosSenha(senha).map((requisito) => (
                  <span
                    key={requisito.texto}
                    className={requisito.ok ? "requisito-ok" : "requisito-erro"}
                  >
                    {requisito.texto}
                  </span>
                ))}
              </div>
            )}
          </label>

          <label>
            <span>
              Confirmar senha <span className="obrigatorio">*</span>
            </span>
            <div className="campo-senha">
              <input
                type={mostrarConfirmarSenha ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={
                  confirmarSenha.length === 0
                    ? bordaTutor("confirmarSenha")
                    : confirmarSenha === senha
                    ? "campo-valido"
                    : "campo-invalido"
                }
              />
              <i
                className={`fa-solid ${
                  mostrarConfirmarSenha ? "fa-eye-slash" : "fa-eye"
                } icone-olho`}
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              ></i>
            </div>
            {confirmarSenha.length > 0 && confirmarSenha !== senha && (
              <span className="requisito-erro">
                A senha digitada deve ser a mesma.
              </span>
            )}
          </label>

          <h3 className="login-secao-titulo">Dados pessoais</h3>

          <label>
            <span>
              Nome <span className="obrigatorio">*</span>
            </span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={bordaTutor("nome")}
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
              className={bordaTutor("sobrenome")}
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
              className={bordaTutor("cpf")}
            />
            {cpfExiste && (
              <span className="aviso-cpf">
                Esse CPF já está cadastrado. Tente entrar em vez de criar uma
                nova conta.
              </span>
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
              className={bordaTutor("dataNascimento")}
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
              invalido={tentouEnviar && vaziosTutor.includes("sexo")}
            />
          </label>

          <h3 className="login-secao-titulo">Endereço</h3>

          <CamposEndereco
            cep={cep}
            aoMudarCep={setCep}
            endereco={endereco}
            aoMudarEndereco={(campo, valor) =>
              setEndereco((a) => ({ ...a, [campo]: valor }))
            }
            borda={bordaTutor}
          />

          {erroCadastro && <span className="aviso-cpf">{erroCadastro}</span>}

          <button
            className="botao-login"
            onClick={criarConta}
            disabled={enviando}
          >
            {enviando ? "Criando conta..." : "Criar conta"}
          </button>
        </div>
      )}

      {passo === "formProfissional" && (
        <div className="login-form">
          <button
            className="botao-google"
            onClick={() => loginComGoogle("profissional", tipoProfissional)}
          >
            <i className="fa-brands fa-google"></i> Entrar com Google
          </button>
          <span className="divisor-ou">ou crie sua conta com e-mail</span>

          <p className="obrigatorio-legenda">
            <span className="obrigatorio">*</span> Campos obrigatórios
          </p>

          <label>
            <span>
              E-mail <span className="obrigatorio">*</span>
            </span>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={emailProf}
              onChange={(e) => setEmailProf(e.target.value)}
              className={bordaProf("emailProf")}
            />
          </label>

          <label>
            <span>
              Senha <span className="obrigatorio">*</span>
            </span>
            <div className="campo-senha">
              <input
                type={mostrarSenhaProf ? "text" : "password"}
                placeholder="Crie uma senha"
                value={senhaProf}
                onChange={(e) => setSenhaProf(e.target.value)}
                className={
                  senhaProf.length === 0
                    ? bordaProf("senhaProf")
                    : validarSenha(senhaProf)
                    ? "campo-valido"
                    : "campo-invalido"
                }
              />
              <i
                className={`fa-solid ${
                  mostrarSenhaProf ? "fa-eye-slash" : "fa-eye"
                } icone-olho`}
                onClick={() => setMostrarSenhaProf(!mostrarSenhaProf)}
              ></i>
            </div>
            {senhaProf.length > 0 && (
              <div className="requisitos-senha">
                {requisitosSenha(senhaProf).map((requisito) => (
                  <span
                    key={requisito.texto}
                    className={requisito.ok ? "requisito-ok" : "requisito-erro"}
                  >
                    {requisito.texto}
                  </span>
                ))}
              </div>
            )}
          </label>

          <label>
            <span>
              Confirmar senha <span className="obrigatorio">*</span>
            </span>
            <div className="campo-senha">
              <input
                type={mostrarConfirmarSenhaProf ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmarSenhaProf}
                onChange={(e) => setConfirmarSenhaProf(e.target.value)}
                className={
                  confirmarSenhaProf.length === 0
                    ? bordaProf("confirmarSenhaProf")
                    : confirmarSenhaProf === senhaProf
                    ? "campo-valido"
                    : "campo-invalido"
                }
              />
              <i
                className={`fa-solid ${
                  mostrarConfirmarSenhaProf ? "fa-eye-slash" : "fa-eye"
                } icone-olho`}
                onClick={() =>
                  setMostrarConfirmarSenhaProf(!mostrarConfirmarSenhaProf)
                }
              ></i>
            </div>
            {confirmarSenhaProf.length > 0 &&
              confirmarSenhaProf !== senhaProf && (
                <span className="requisito-erro">
                  A senha digitada deve ser a mesma.
                </span>
              )}
          </label>

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
                  className={bordaProf("nomeCompleto")}
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
                  className={bordaProf("cpfProf")}
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
                  className={bordaProf("dataNascimentoProf")}
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
                  className={bordaProf("crmv")}
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
                  invalido={tentouEnviarProf && vaziosProf.includes("crmvUf")}
                />
                {crmvExiste && (
                  <span className="aviso-cpf">
                    Esse CRMV já está cadastrado. Tente entrar em vez de
                    criar uma nova conta.
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
                  className={bordaProf("whatsapp")}
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
                  className={bordaProf("nomeCompleto")}
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
                  className={bordaProf("crmv")}
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
                  invalido={tentouEnviarProf && vaziosProf.includes("crmvUf")}
                />
                {crmvExiste && (
                  <span className="aviso-cpf">
                    Esse CRMV já está cadastrado. Tente entrar em vez de
                    criar uma nova conta.
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
                  className={bordaProf("cpfProf")}
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
                  className={bordaProf("whatsapp")}
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
                  className={bordaProf("nomeFantasia")}
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
                  className={bordaProf("razaoSocial")}
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
                  className={bordaProf("proprietario")}
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
                  className={bordaProf("cnpj")}
                />
                {cnpjExiste && (
                  <span className="aviso-cpf">
                    Esse CNPJ já está cadastrado.
                  </span>
                )}
              </label>
            </>
          )}

          {tipoProfissional === "autonomo" && (
            <h3 className="login-secao-titulo">Endereço</h3>
          )}

          <CamposEndereco
            cep={cepProf}
            aoMudarCep={setCepProf}
            endereco={enderecoProf}
            aoMudarEndereco={(campo, valor) =>
              setEnderecoProf((a) => ({ ...a, [campo]: valor }))
            }
            borda={bordaProf}
            campoCep="cepProf"
          />

          {erroCadastroProf && (
            <span className="aviso-cpf">{erroCadastroProf}</span>
          )}

          <button
            className="botao-login"
            onClick={criarContaProfissional}
            disabled={enviando}
          >
            {enviando ? "Criando conta..." : "Criar conta"}
          </button>
        </div>
      )}
    </div>
  );
}
