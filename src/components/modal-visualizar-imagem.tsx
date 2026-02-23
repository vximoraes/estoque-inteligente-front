'use client';
import React, { useEffect } from 'react';

interface ModalVisualizarImagemProps {
  isOpen: boolean;
  onClose: () => void;
  imagemUrl: string;
  nomeItem: string;
}

export default function ModalVisualizarImagem({
  isOpen,
  onClose,
  imagemUrl,
  nomeItem,
}: ModalVisualizarImagemProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 cursor-default"
      onClick={handleOverlayClick}
      data-test="modal-visualizar-imagem-overlay"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        {/* Imagem */}
        <img
          src={imagemUrl}
          alt={nomeItem}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
          data-test="modal-visualizar-imagem-img"
          onClick={handleContentClick}
        />
      </div>
    </div>
  );
}
