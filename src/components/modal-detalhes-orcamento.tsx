'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { get } from '@/lib/fetchData';
import { Orcamento } from '@/types/orcamentos';

interface OrcamentoApiResponse {
  data: Orcamento;
}

interface ModalDetalhesOrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  orcamentoId: string;
  orcamentoNome?: string;
  orcamentoDescricao?: string;
}

export default function ModalDetalhesOrcamento({
  isOpen,
  onClose,
  orcamentoId,
  orcamentoNome,
  orcamentoDescricao,
}: ModalDetalhesOrcamentoProps) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orcamentoId) {
      loadOrcamento();
    }
  }, [isOpen, orcamentoId]);

  const loadOrcamento = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await get<OrcamentoApiResponse>(
        `/orcamentos/${orcamentoId}`,
      );
      setOrcamento(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar orçamento:', err);
      setError(
        err?.response?.data?.message || 'Erro ao carregar dados do orçamento',
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    setOrcamento(null);
    setError(null);
    setCopiedField(null);
    onClose();
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={handleBackdropClick}
      data-test="modal-detalhes-orcamento"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer z-10"
            title="Fechar"
            aria-label="Fechar modal"
            data-test="modal-detalhes-close"
          >
            <X size={20} />
          </button>
          <div className="text-center px-8">
            <div className="max-h-[100px] overflow-y-auto mb-2">
              <h2
                className="text-xl font-semibold text-gray-900 break-words"
                data-test="modal-detalhes-header"
              >
                {orcamentoNome || orcamento?.nome || 'Detalhes do Orçamento'}
              </h2>
            </div>
            {(orcamentoDescricao || orcamento?.descricao) && (
              <div className="max-h-[120px] overflow-y-auto mb-3">
                <p
                  className="text-sm text-gray-600 break-words text-center max-w-full"
                  data-test="modal-detalhes-descricao"
                >
                  {orcamentoDescricao || orcamento?.descricao}
                </p>
              </div>
            )}
            <p
              className="text-xl font-semibold text-blue-600"
              data-test="modal-detalhes-total"
            >
              {isLoading
                ? 'Carregando...'
                : orcamento
                  ? `R$ ${orcamento.total.toFixed(2)}`
                  : '-'}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <div className="font-medium mb-1">
                Não foi possível carregar o orçamento
              </div>
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div
              className="flex justify-center py-8"
              data-test="loading-spinner"
            >
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
              </div>
            </div>
          ) : orcamento ? (
            <div className="space-y-4 text-left">
              {/* Componentes */}
              {orcamento.itens && orcamento.itens.length > 0 && (
                <div>
                  <label className="text-lg font-semibold text-gray-900 block mb-2">
                    Componentes ({orcamento.itens.length})
                  </label>
                  <div
                    className="border rounded-lg overflow-x-auto"
                    data-test="modal-detalhes-tabela"
                  >
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-3 sm:px-4 py-2 font-semibold text-gray-700 min-w-[150px]">
                            Nome
                          </th>
                          <th className="text-center px-3 sm:px-4 py-2 font-semibold text-gray-700 min-w-[60px]">
                            Qtd
                          </th>
                          <th className="text-right px-3 sm:px-4 py-2 font-semibold text-gray-700 min-w-[100px]">
                            Valor Unit.
                          </th>
                          <th className="text-right px-3 sm:px-4 py-2 font-semibold text-gray-700 min-w-[100px]">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orcamento.itens.map((comp, index) => (
                          <tr
                            key={index}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="px-3 sm:px-4 py-2 text-gray-900 min-w-[150px]">
                              <div
                                className="text-sm font-semibold text-gray-900 truncate"
                                title={comp.nome || '-'}
                              >
                                {comp.nome || '-'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-center text-gray-900 min-w-[60px]">
                              {comp.quantidade}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-right text-gray-900 min-w-[100px] whitespace-nowrap">
                              R$ {comp.valor_unitario.toFixed(2)}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-right text-gray-900 font-medium min-w-[100px] whitespace-nowrap">
                              R${' '}
                              {(comp.quantidade * comp.valor_unitario).toFixed(
                                2,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Datas */}
              {(orcamento.createdAt || orcamento.updatedAt) && (
                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                  {orcamento.createdAt && (
                    <div>
                      <label className="text-base font-medium text-gray-700 block mb-2">
                        Criado em
                      </label>
                      <p
                        className="text-base text-gray-600"
                        data-test="modal-detalhes-data-criacao"
                      >
                        {new Date(orcamento.createdAt).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                  )}
                  {orcamento.updatedAt && (
                    <div>
                      <label className="text-base font-medium text-gray-700 block mb-2">
                        Atualizado em
                      </label>
                      <p
                        className="text-base text-gray-600"
                        data-test="modal-detalhes-data-atualizacao"
                      >
                        {new Date(orcamento.updatedAt).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
