'use client';
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const ANIMATION_DURATION = 300;

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
  const [visible, setVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsClosing(false);
      return;
    }

    if (visible) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`fixed inset-0 z-[60] backdrop-blur-[3px] cursor-default ${
        isClosing
          ? 'animate-out fade-out-0 duration-300'
          : 'animate-in fade-in-0 duration-300'
      }`}
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
          className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto duration-300 ${
            isClosing
              ? 'animate-out fade-out-0 zoom-out-95'
              : 'animate-in fade-in-0 zoom-in-95'
          }`}
          data-test="modal-visualizar-imagem-img"
          onClick={handleContentClick}
        />
      </div>
    </div>
  );
}
