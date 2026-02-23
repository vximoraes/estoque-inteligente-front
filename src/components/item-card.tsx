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
      className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 selected'
          : 'border-gray-200 hover:border-blue-300'
      }`}
      data-test={dataTestId}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {/* Imagem do item */}
        <div
          className={`w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${
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
            <Package className="w-8 h-8 text-gray-600" />
          )}
        </div>

        {/* Nome do item */}
        <div className="w-full min-h-[2.5rem] flex items-start">
          <h3
            className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 w-full"
            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
            title={nome}
          >
            {nome}
          </h3>
        </div>

        {/* Categoria */}
        <p className="text-xs text-gray-500 truncate w-full" title={categoria}>
          {categoria}
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
