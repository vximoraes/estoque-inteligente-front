'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Copy, Check } from 'lucide-react';
import { get } from '@/lib/fetchData';
import { Fornecedor } from '@/types/fornecedores';
import { ModalShell } from '@/components/ui/modal-shell';

interface FornecedorApiResponse {
  data: Fornecedor;
}

interface ModalDetalhesFornecedorProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedorId: string;
}

export default function ModalDetalhesFornecedor({
  isOpen,
  onClose,
  fornecedorId,
}: ModalDetalhesFornecedorProps) {
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fornecedorId) {
      loadFornecedor();
    }
  }, [isOpen, fornecedorId]);

  const loadFornecedor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await get<FornecedorApiResponse>(
        `/fornecedores/${fornecedorId}`,
      );
      setFornecedor(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar fornecedor:', err);
      setError(
        err?.response?.data?.message || 'Erro ao carregar dados do fornecedor',
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
    setFornecedor(null);
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

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      zIndex={99999}
      contentClassName="max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-border flex-shrink-0">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer z-10"
          title="Fechar"
        >
          <X size={20} />
        </button>
        <div className="text-center px-8">
          <div className="max-h-[100px] overflow-y-auto mb-2">
            <h2 className="text-xl font-semibold text-foreground break-words">
              {fornecedor?.nome || 'Detalhes do Fornecedor'}
            </h2>
          </div>
          {fornecedor?.descricao && (
            <p className="text-sm text-muted-foreground mb-3 break-words text-center max-w-full">
              {fornecedor.descricao}
            </p>
          )}
          {isLoading ? (
            <p className="text-lg font-semibold text-[#306FCC]">
              Carregando...
            </p>
          ) : fornecedor?.url ? (
            <a
              href={fornecedor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-semibold text-[#306FCC] hover:text-[#306FCC]/80 hover:underline max-w-full"
              title={fornecedor.url}
            >
              <span className="truncate">{fornecedor.url}</span>
              <ExternalLink size={18} className="flex-shrink-0" />
            </a>
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">
              Sem URL cadastrada
            </p>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Mensagem de erro */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
            <div className="font-medium mb-1">
              Não foi possível carregar o fornecedor
            </div>
            <div className="text-destructive/80">{error}</div>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#0f1419] border-r-transparent animate-spin"></div>
            </div>
          </div>
        ) : fornecedor ? (
          <div className="space-y-4 text-left">
            {/* Contato */}
            {fornecedor.contato && (
              <div>
                <label className="text-lg font-semibold text-foreground block mb-2">
                  Contato
                </label>
                <div className="flex items-center gap-2">
                  <p
                    className="text-base text-foreground truncate flex-1"
                    title={fornecedor.contato}
                  >
                    {fornecedor.contato}
                  </p>
                  <button
                    onClick={() => handleCopy(fornecedor.contato!, 'contato')}
                    className="relative p-1.5 text-foreground hover:bg-muted rounded-sm transition-colors flex-shrink-0 cursor-pointer"
                    title="Copiar contato"
                  >
                    <span className="relative block w-4 h-4">
                      <Copy
                        className={`absolute inset-0 w-4 h-4 transition-all duration-200 ease-out ${
                          copiedField === 'contato'
                            ? 'opacity-0 scale-50 -rotate-45'
                            : 'opacity-100 scale-100 rotate-0'
                        }`}
                      />
                      <Check
                        className={`absolute inset-0 w-4 h-4 transition-all duration-200 ease-out ${
                          copiedField === 'contato'
                            ? 'opacity-100 scale-100 rotate-0'
                            : 'opacity-0 scale-50 rotate-45'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Datas */}
            {(fornecedor.createdAt || fornecedor.updatedAt) && (
              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                {fornecedor.createdAt && (
                  <div>
                    <label className="text-base font-medium text-muted-foreground block mb-2">
                      Criado em
                    </label>
                    <p className="text-base text-muted-foreground">
                      {new Date(fornecedor.createdAt).toLocaleDateString(
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
                {fornecedor.updatedAt && (
                  <div>
                    <label className="text-base font-medium text-muted-foreground block mb-2">
                      Atualizado em
                    </label>
                    <p className="text-base text-muted-foreground">
                      {new Date(fornecedor.updatedAt).toLocaleDateString(
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
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
