'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
      className="fixed inset-0 z-50 bg-black/50 cursor-default"
      onClick={handleOverlayClick}
      data-test="modal-visualizar-imagem-overlay"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer z-10"
        title="Fechar"
        data-test="modal-visualizar-imagem-close"
      >
        <X size={22} />
      </button>
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        {/* Imagem */}
        <img
          src={imagemUrl}
          alt={nomeItem}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300"
          data-test="modal-visualizar-imagem-img"
          onClick={handleContentClick}
        />
      </div>
    </div>
  );
}
