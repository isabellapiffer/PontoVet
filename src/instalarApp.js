// Instalar o PontoVet na tela inicial do celular (PWA).
// Android/Chrome: o navegador avisa que dá para instalar (evento "beforeinstallprompt");
// guardamos esse aviso para abrir a janela de instalação quando a pessoa tocar em "Instalar App".
// iPhone: não existe esse aviso, então mostramos a dica de como adicionar pelo Safari.

let pedidoDeInstalacao = null;
const ouvintes = new Set();

function avisarOuvintes() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault(); // não deixa o Chrome mostrar a barrinha dele sozinho
  pedidoDeInstalacao = evento;
  avisarOuvintes();
});

window.addEventListener("appinstalled", () => {
  pedidoDeInstalacao = null;
  avisarOuvintes();
});

// Aberto pelo ícone da tela inicial (e não pelo navegador)
export function jaInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// O iPad novo se apresenta como "Macintosh", mas tem tela de toque
export function ehIphone(navegador = window.navigator) {
  return (
    /iphone|ipad|ipod/i.test(navegador.userAgent) ||
    (navegador.userAgent.includes("Macintosh") && navegador.maxTouchPoints > 1)
  );
}

export function podeInstalar() {
  if (jaInstalado()) return false;
  return pedidoDeInstalacao !== null || ehIphone();
}

// Abre a janela de instalação do Chrome. Só existe no Android/computador.
export async function abrirJanelaDeInstalacao() {
  if (!pedidoDeInstalacao) return;
  pedidoDeInstalacao.prompt();
  await pedidoDeInstalacao.userChoice;
  pedidoDeInstalacao = null; // o Chrome só deixa usar o aviso uma vez
  avisarOuvintes();
}

// Para a tela atualizar quando o aviso do Chrome chegar ou o app for instalado
export function aoMudarInstalacao(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}
