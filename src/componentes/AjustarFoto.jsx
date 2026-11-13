import { useState } from "react";
import Cropper from "react-easy-crop";
import { IoRemove, IoAdd } from "react-icons/io5";
import "./ajustarfoto.css";

// Carrega a imagem escolhida para poder desenhar um pedaço dela.
function carregarImagem(endereco) {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = rejeitar;
    imagem.src = endereco;
  });
}

// Recorta só o quadrado que a pessoa ajustou e devolve um arquivo .jpg.
// A foto final tem no máximo 800x800 pixels, então fica leve para salvar.
async function recortarImagem(endereco, area) {
  const imagem = await carregarImagem(endereco);
  const tamanho = Math.min(area.width, 800);

  const tela = document.createElement("canvas");
  tela.width = tamanho;
  tela.height = tamanho;
  tela
    .getContext("2d")
    .drawImage(imagem, area.x, area.y, area.width, area.height, 0, 0, tamanho, tamanho);

  return new Promise((resolver, rejeitar) => {
    tela.toBlob(
      (blob) => {
        if (!blob) return rejeitar(new Error("Não deu para gerar a foto."));
        resolver(new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  });
}

// Janela para arrastar e dar zoom na foto, dentro de um círculo.
// imagem: o endereço da foto escolhida
// aoConfirmar(arquivo): recebe a foto já recortada
export default function AjustarFoto({ imagem, aoConfirmar, aoCancelar }) {
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaRecortada, setAreaRecortada] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function usarFoto() {
    if (!areaRecortada) return;
    setSalvando(true);
    setErro("");
    try {
      const arquivo = await recortarImagem(imagem, areaRecortada);
      aoConfirmar(arquivo);
    } catch (erroFoto) {
      // Sem isso o botão ficava em "Preparando..." para sempre
      console.error(erroFoto);
      setErro("Não consegui abrir essa foto. Tente outra.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ajustar-fundo">
      <section className="ajustar" role="dialog" aria-label="Ajustar foto">
        <h2 className="ajustar-titulo">Ajustar foto</h2>
        <p className="ajustar-dica">Arraste para centralizar e use o zoom.</p>

        <div className="ajustar-area">
          <Cropper
            image={imagem}
            crop={posicao}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setPosicao}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setAreaRecortada(pixels)}
          />
        </div>

        <div className="ajustar-zoom">
          <IoRemove aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            aria-label="Zoom"
            onChange={(evento) => setZoom(Number(evento.target.value))}
          />
          <IoAdd aria-hidden="true" />
        </div>

        {erro && <p className="aviso-cpf">{erro}</p>}

        <div className="ajustar-botoes">
          <button className="ajustar-cancelar" onClick={aoCancelar}>
            Cancelar
          </button>
          <button className="ajustar-usar" onClick={usarFoto} disabled={salvando}>
            {salvando ? "Preparando..." : "Usar foto"}
          </button>
        </div>
      </section>
    </div>
  );
}
