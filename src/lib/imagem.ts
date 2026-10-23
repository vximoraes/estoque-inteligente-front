export const TIPOS_DE_IMAGEM = 'image/jpeg,image/png';

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export function erroDeImagem(arquivo: File): string | null {
  if (!TIPOS_DE_IMAGEM.split(',').includes(arquivo.type)) {
    return 'Use uma imagem PNG ou JPG.';
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return 'A imagem deve ter no máximo 5 MB.';
  }
  return null;
}
