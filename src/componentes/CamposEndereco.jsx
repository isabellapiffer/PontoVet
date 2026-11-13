import { useEffect, useRef, useState } from "react";
import { SelectCostumizado } from "../paginas/Mural.jsx/SelectCostumizado.jsx";
import { formatarCep } from "../formatadores.js";
import {
  ufs,
  paises,
  filtrarCidades,
  carregarCidades,
  buscarCep,
  AVISO_CEP_NAO_ENCONTRADO,
} from "../endereco.js";

// Quantas cidades aparecem de uma vez na lista de sugestões
const MAXIMO_SUGESTOES = 10;

// Campo Cidade com sugestões (mesmo jeito do campo Raça do pet).
// Ao digitar "sao pa" aparece "São Paulo - SP"; ao escolher, preenche Cidade e Estado.
// A pessoa também pode só digitar e não escolher nada da lista.
function CampoCidade({ valor, cidades, aoDigitar, aoEscolher, invalido }) {
  const [aberto, setAberto] = useState(false);
  const [indiceDestaque, setIndiceDestaque] = useState(-1);
  const caixaRef = useRef(null);
  const opcoesRefs = useRef([]);

  const encontradas = filtrarCidades(cidades, valor);
  const sugestoes = encontradas.slice(0, MAXIMO_SUGESTOES);

  function escolher(cidade) {
    aoEscolher(cidade);
    setAberto(false);
    setIndiceDestaque(-1);
  }

  function fechar() {
    setAberto(false);
    setIndiceDestaque(-1);
  }

  useEffect(() => {
    function aoClicarFora(evento) {
      if (caixaRef.current && !caixaRef.current.contains(evento.target)) {
        fechar();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  useEffect(() => {
    if (indiceDestaque >= 0 && opcoesRefs.current[indiceDestaque]) {
      opcoesRefs.current[indiceDestaque].scrollIntoView({ block: "nearest" });
    }
  }, [indiceDestaque]);

  return (
    <div className="select-custom" ref={caixaRef}>
      <input
        type="text"
        className={invalido ? "select-caixa campo-invalido" : "select-caixa"}
        value={valor}
        onChange={(evento) => {
          aoDigitar(evento.target.value);
          setAberto(true);
          setIndiceDestaque(-1);
        }}
        onFocus={() => setAberto(true)}
        onBlur={fechar}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowDown") {
            evento.preventDefault();
            setAberto(true);
            setIndiceDestaque((indiceAtual) =>
              Math.min(indiceAtual + 1, sugestoes.length - 1)
            );
          }
          if (evento.key === "ArrowUp") {
            evento.preventDefault();
            setIndiceDestaque((indiceAtual) => Math.max(indiceAtual - 1, 0));
          }
          if (evento.key === "Enter") {
            evento.preventDefault();
            if (indiceDestaque >= 0 && sugestoes[indiceDestaque]) {
              escolher(sugestoes[indiceDestaque]);
            } else if (encontradas.length === 1) {
              // Igual ao campo Raça: se só sobrou uma cidade, o Enter escolhe ela
              escolher(encontradas[0]);
            } else {
              // Várias ou nenhuma: fecha a lista e mantém o que foi digitado
              fechar();
            }
          }
          if (evento.key === "Escape") {
            fechar();
          }
        }}
      />

      {aberto && sugestoes.length > 0 && (
        <div className="select-opcoes">
          {sugestoes.map((cidade, indice) => (
            <p
              key={cidade.texto}
              ref={(el) => (opcoesRefs.current[indice] = el)}
              className={indice === indiceDestaque ? "select-destaque" : ""}
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(cidade);
              }}
            >
              {cidade.texto}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Campos de endereço usados no cadastro de conta (Login), no Completar cadastro
// e no Meu perfil: CEP, Rua, Número, Complemento, Cidade, Estado e País.
// - País = Brasil: Estado é a lista de siglas e Cidade tem sugestões; o CEP busca no ViaCEP.
// - Outro país: Estado e Cidade são texto livre, e o CEP não busca nada.
//
// cep, aoMudarCep(valor): o CEP fica separado do resto, como já era nas telas
// endereco: { rua, numero, complemento, cidade, estado, pais }
// aoMudarEndereco(campo, valor): ex.: aoMudarEndereco("cidade", "Itajaí")
// borda(campo): a função da tela que devolve "campo-invalido" para os vazios
// campoCep: o nome do CEP na lista de vazios da tela ("cep" ou "cepProf")
export default function CamposEndereco({
  cep,
  aoMudarCep,
  endereco,
  aoMudarEndereco,
  borda,
  campoCep = "cep",
}) {
  const [avisoCep, setAvisoCep] = useState("");
  const [cidades, setCidades] = useState([]);
  const noBrasil = endereco.pais === "Brasil";

  // A lista de cidades só é baixada quando o país é Brasil
  useEffect(() => {
    if (!noBrasil) return;
    let ativo = true;
    carregarCidades()
      .then((lista) => {
        if (ativo) setCidades(lista);
      })
      .catch(() => {
        // Sem a lista, a Cidade continua funcionando como texto livre
      });
    return () => {
      ativo = false;
    };
  }, [noBrasil]);

  async function aoSairDoCep() {
    if (!noBrasil) return;
    if (cep.replace(/\D/g, "").length !== 8) return;

    const resultado = await buscarCep(cep);

    if (resultado.aviso) {
      setAvisoCep(resultado.aviso);
      return;
    }

    aoMudarEndereco("rua", resultado.rua);
    aoMudarEndereco("cidade", resultado.cidade);
    aoMudarEndereco("estado", resultado.estado);
  }

  function trocarPais(novoPais) {
    // Saindo do Brasil (ou voltando para ele), Cidade e Estado mudam de tipo
    // de campo, então começam vazios (ex.: "SC" não serve na Argentina)
    if ((novoPais === "Brasil") !== noBrasil) {
      aoMudarEndereco("cidade", "");
      aoMudarEndereco("estado", "");
      setAvisoCep("");
    }
    aoMudarEndereco("pais", novoPais);
  }

  // Borda vermelha no CEP: quando está vazio (depois de tentar enviar)
  // ou quando o ViaCEP disse que esse CEP não existe
  const bordaCep =
    borda(campoCep) ||
    (avisoCep === AVISO_CEP_NAO_ENCONTRADO ? "campo-invalido" : "");

  return (
    <>
      <label>
        <span>
          CEP <span className="obrigatorio">*</span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          value={cep}
          onChange={(e) => {
            aoMudarCep(formatarCep(e.target.value));
            setAvisoCep("");
          }}
          onBlur={aoSairDoCep}
          className={bordaCep}
        />
        {avisoCep && <span className="aviso-cpf">{avisoCep}</span>}
      </label>

      <label>
        <span>
          Rua <span className="obrigatorio">*</span>
        </span>
        <input
          type="text"
          value={endereco.rua}
          onChange={(e) => aoMudarEndereco("rua", e.target.value)}
          className={borda("rua")}
        />
      </label>

      <label>
        <span>
          Número <span className="obrigatorio">*</span>
        </span>
        <input
          type="text"
          value={endereco.numero}
          onChange={(e) => aoMudarEndereco("numero", e.target.value)}
          className={borda("numero")}
        />
      </label>

      <label>
        Complemento (opcional)
        <input
          type="text"
          value={endereco.complemento}
          onChange={(e) => aoMudarEndereco("complemento", e.target.value)}
        />
      </label>

      <label>
        <span>
          Cidade <span className="obrigatorio">*</span>
        </span>
        {noBrasil ? (
          <CampoCidade
            valor={endereco.cidade}
            cidades={cidades}
            aoDigitar={(texto) => aoMudarEndereco("cidade", texto)}
            aoEscolher={(cidade) => {
              aoMudarEndereco("cidade", cidade.nome);
              aoMudarEndereco("estado", cidade.uf);
            }}
            invalido={Boolean(borda("cidade"))}
          />
        ) : (
          <input
            type="text"
            value={endereco.cidade}
            onChange={(e) => aoMudarEndereco("cidade", e.target.value)}
            className={borda("cidade")}
          />
        )}
      </label>

      <label>
        <span>
          Estado <span className="obrigatorio">*</span>
        </span>
        {noBrasil ? (
          <SelectCostumizado
            label="Selecione"
            opcoes={ufs}
            valor={endereco.estado}
            aoEscolher={(uf) => aoMudarEndereco("estado", uf)}
            invalido={Boolean(borda("estado"))}
          />
        ) : (
          <input
            type="text"
            value={endereco.estado}
            onChange={(e) => aoMudarEndereco("estado", e.target.value)}
            className={borda("estado")}
          />
        )}
      </label>

      <label>
        <span>
          País <span className="obrigatorio">*</span>
        </span>
        <SelectCostumizado
          label="Selecione"
          opcoes={paises}
          valor={endereco.pais}
          aoEscolher={trocarPais}
          invalido={Boolean(borda("pais"))}
        />
      </label>
    </>
  );
}
