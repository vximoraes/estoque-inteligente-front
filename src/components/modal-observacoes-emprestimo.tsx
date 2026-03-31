'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Emprestimo } from '@/types/emprestimos';

interface ModalObservacoesEmprestimoProps {
  isOpen: boolean;
  onClose: () => void;
  emprestimo: Emprestimo;
}


export default function ModalObservacoesEmprestimo({
  isOpen,
  onClose,
  emprestimo,
}: ModalObservacoesEmprestimoProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const temObsEmprestimo =
    emprestimo.observacoes_emprestimo &&
    emprestimo.observacoes_emprestimo.trim() !== '';
  const temObsDevolucao =
    emprestimo.observacoes_devolucao &&
    emprestimo.observacoes_devolucao.trim() !== '';

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
          <div className="text-center px-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Observações do Empréstimo
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {emprestimo.item?.nome || 'Item'}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">

          {/* Observações do empréstimo */}
          <div>
            <label className="text-lg font-semibold text-gray-900 block mb-2">
              Observações do empréstimo
            </label>
            <p className="text-base text-gray-900">
              {temObsEmprestimo ? emprestimo.observacoes_emprestimo : '-'}
            </p>
          </div>

          {/* Observações da devolução */}
          <div>
            <label className="text-lg font-semibold text-gray-900 block mb-2">
              Observações da devolução
            </label>
            <p className="text-base text-gray-900">
              {temObsDevolucao ? emprestimo.observacoes_devolucao : '-'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
