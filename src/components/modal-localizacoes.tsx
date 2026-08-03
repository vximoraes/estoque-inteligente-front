import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Package } from 'lucide-react';
import { EstoqueData } from '@/types/itens';
import { ModalShell } from '@/components/ui/modal-shell';

interface ModalLocalizacoesProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  itemDescricao?: string;
  estoques: EstoqueData[];
  isLoading: boolean;
  totalQuantidade: number;
}

export default function ModalLocalizacoes({
  isOpen,
  onClose,
  itemId,
  itemNome,
  itemDescricao,
  estoques,
  isLoading,
  totalQuantidade,
}: ModalLocalizacoesProps) {
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

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={99999}
      data-test="modal-localizacoes-backdrop"
      contentClassName="max-w-lg max-h-[80vh] overflow-hidden"
      role="dialog"
      contentDataTest="modal-localizacoes"
    >
      {/* Header do Modal */}
      <div
        className="relative p-6 border-b border-border"
        data-test="modal-localizacoes-header"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer z-10"
          title="Fechar"
          data-test="modal-localizacoes-close"
        >
          <X size={20} />
        </button>
        <div className="text-center px-8">
          <div className="max-h-[100px] overflow-y-auto mb-2">
            <h2
              className="text-xl font-semibold text-foreground wrap-break-words"
              data-test="modal-localizacoes-titulo"
            >
              {itemNome}
            </h2>
          </div>
          {itemDescricao && (
            <p
              className="text-sm text-muted-foreground mb-3 wrap-break-words text-center max-w-full"
              data-test="modal-localizacoes-descricao"
            >
              {itemDescricao}
            </p>
          )}
          <p
            className="text-xl font-semibold text-[var(--ei-accent)]"
            data-test="modal-localizacoes-total"
          >
            {isLoading ? 'Carregando...' : totalQuantidade}
          </p>
        </div>
      </div>

      {/* Conteúdo das Localizações */}
      <div
        className="p-6 space-y-4 max-h-[400px] overflow-y-auto"
        data-test="modal-localizacoes-content"
      >
        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-12"
            data-test="modal-localizacoes-loading"
          >
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              Carregando localizações...
            </p>
          </div>
        ) : estoques.filter(
            (estoque) =>
              estoque.quantidade != null &&
              !isNaN(Number(estoque.quantidade)) &&
              Number(estoque.quantidade) > 0,
          ).length > 0 ? (
          estoques
            .filter(
              (estoque) =>
                estoque.quantidade != null &&
                !isNaN(Number(estoque.quantidade)) &&
                Number(estoque.quantidade) > 0,
            )
            .map((estoque, index) => (
              <div
                key={estoque._id}
                className="border border-border rounded-md p-4 bg-muted/50"
                data-test={`localizacao-item-${index}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[var(--ei-accent)] shrink-0" />
                    <span className="text-base text-muted-foreground shrink-0">
                      Localização:
                    </span>
                    <span
                      className="text-base font-semibold text-foreground truncate"
                      title={estoque.localizacao.nome}
                      data-test={`localizacao-nome-${index}`}
                    >
                      {estoque.localizacao.nome}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-[var(--ei-accent)] shrink-0" />
                    <span className="text-base text-muted-foreground shrink-0">
                      Quantidade:
                    </span>
                    <span
                      className="text-base font-semibold text-foreground"
                      data-test={`localizacao-quantidade-${index}`}
                    >
                      {estoque.quantidade}
                    </span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div
            className="text-center py-8"
            data-test="modal-localizacoes-empty"
          >
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma localização encontrada para este item.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
