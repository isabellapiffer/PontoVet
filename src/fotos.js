// Foto escolhida pelo tutor (pet ou perfil), antes da tela de ajustar.
// Aceita fotos de qualquer tamanho do celular: depois do recorte ela fica
// com no máximo 800x800 (ver AjustarFoto).

// Fotos do iPhone podem vir em HEIC, que o Chrome do computador não abre.
function ehHeic(arquivo) {
  return /image\/hei[cf]/i.test(arquivo.type) || /\.hei[cf]$/i.test(arquivo.name);
}

// Devolve o endereço da foto para mostrar na tela de ajustar.
// HEIC vira JPEG antes (a biblioteca só é baixada quando precisa).
// Se não der para abrir, dá erro: quem chama mostra o aviso.
export async function abrirFotoEscolhida(arquivo) {
  if (!arquivo.type.startsWith("image/") && !ehHeic(arquivo)) {
    throw new Error("Esse arquivo não é uma foto.");
  }

  let foto = arquivo;
  if (ehHeic(arquivo)) {
    const { default: heic2any } = await import("heic2any");
    const convertida = await heic2any({ blob: arquivo, toType: "image/jpeg", quality: 0.9 });
    foto = Array.isArray(convertida) ? convertida[0] : convertida;
  }

  return URL.createObjectURL(foto);
}

export const AVISO_FOTO = "Não consegui abrir essa foto. Tente outra.";
