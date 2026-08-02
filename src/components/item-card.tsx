'use client';
import React, { useState } from 'react';
import { Package } from 'lucide-react';
import ModalVisualizarImagem from './modal-visualizar-imagem';

interface ItemCardSimplesProps {
  id: string;
  nome: string;
  categoria: string;
  imagem?: string;
  onClick: (id: string, nome: string) => void;
  isSelected?: boolean;
  dataTestId?: string;
}

export default function ItemCardSimples({
  id,
  nome,
  categoria,
  imagem,
  onClick,
  isSelected = false,
  dataTestId,
}: ItemCardSimplesProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const categoriaFormatada = React.useMemo(() => {
    if (!categoria) return '';

    return categoria
      .toLocaleLowerCase('pt-BR')
      .split(' ')
      .filter(Boolean)
      .map(
        (palavra) =>
          palavra.charAt(0).toLocaleUpperCase('pt-BR') + palavra.slice(1),
      )
      .join(' ');
  }, [categoria]);

  const imagemComTimestamp = React.useMemo(() => {
    if (!imagem) return undefined;
    const separator = imagem.includes('?') ? '&' : '?';
    return `${imagem}${separator}t=${Date.now()}`;
  }, [imagem]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagemComTimestamp) {
      setIsImageModalOpen(true);
    }
  };

  return (
    <div
      onClick={() => onClick(id, nome)}
      className={`bg-card rounded-sm border-2 p-4 transition-colors cursor-pointer ${
        isSelected
          ? 'border-[#0f1419] bg-[#0f1419]/5 selected'
          : 'border-border hover:border-[#0f1419]/40'
      }`}
      data-test={dataTestId}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {/* Imagem do item */}
        <div
          className={`w-16 h-16 bg-muted rounded-sm flex items-center justify-center overflow-hidden shrink-0 ${
            imagemComTimestamp
              ? 'cursor-pointer hover:opacity-80 transition-opacity'
              : ''
          }`}
          onClick={handleImageClick}
          title={
            imagemComTimestamp ? `Clique para ampliar a imagem de ${nome}` : ''
          }
        >
          {imagemComTimestamp ? (
            <img
              src={imagemComTimestamp}
              alt={nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Nome do item */}
        <div className="w-full min-h-10 flex items-start">
          <h3
            className="text-base font-semibold text-foreground leading-tight line-clamp-2 w-full"
            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
            title={nome}
          >
            {nome}
          </h3>
        </div>

        {/* Categoria */}
        <p
          className="text-sm text-muted-foreground truncate w-full"
          title={categoriaFormatada}
        >
          {categoriaFormatada}
        </p>
      </div>

      {/* Modal de visualização da imagem */}
      {imagemComTimestamp && (
        <ModalVisualizarImagem
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imagemUrl={imagemComTimestamp}
          nomeItem={nome}
        />
      )}
    </div>
  );
}
