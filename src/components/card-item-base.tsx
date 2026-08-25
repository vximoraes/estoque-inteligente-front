'use client';
import React, { useState, useEffect } from 'react';
import { Package, MoreHorizontal, X } from 'lucide-react';
import ModalVisualizarImagem from './modal-visualizar-imagem';
import StatusBadge from './status-badge';

export interface CardItemBaseProps {
  id?: string;
  nome: string;
  categoria: string;
  status: string;
  imagem?: string;
  titulo: string;
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onEmprestar?: (id: string) => void;
  emprestarDesabilitado?: boolean;
  emprestarTitle?: string;
  /** Bloco à esquerda do footer — Qtd/Mín (consumo) ou Unid/Disp (patrimônio). */
  metricas: React.ReactNode;
  /** Ícones à direita do badge de status; omitido, o footer não reserva espaço para eles. */
  acoesRapidas?: React.ReactNode;
  'data-test'?: string;
}

export default function CardItemBase({
  id = '',
  nome,
  categoria,
  status,
  imagem,
  titulo,
  isLoading = false,
  onEdit,
  onDelete,
  onClick,
  onEmprestar,
  emprestarDesabilitado = false,
  emprestarTitle,
  metricas,
  acoesRapidas,
  'data-test': dataTest,
}: CardItemBaseProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  const handleClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    if (onClick && id) {
      onClick(id);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagemComTimestamp) {
      setIsImageModalOpen(true);
    }
  };

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

  return (
    <div
      className="bg-card rounded-md border border-border p-4 transition-colors w-full h-full min-h-40 min-w-0 flex flex-col cursor-pointer relative"
      data-test={dataTest || `item-${id}`}
      title={titulo}
      onClick={handleClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-card/90 rounded-md flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-r-transparent animate-spin"
                style={{
                  borderColor:
                    'var(--ei-accent) transparent transparent transparent',
                }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Atualizando...</p>
          </div>
        </div>
      )}

      <div
        className="flex items-start justify-between mb-3 gap-2 overflow-hidden"
        data-test="header"
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden"
          data-test="component-info"
        >
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center overflow-hidden shrink-0 bg-muted/40 border border-border/40 ${
              imagemComTimestamp
                ? 'cursor-pointer hover:opacity-80 transition-opacity'
                : ''
            }`}
            data-test="component-icon"
            onClick={handleImageClick}
            title={
              imagemComTimestamp
                ? `Clique para ampliar a imagem de ${nome}`
                : ''
            }
          >
            {imagemComTimestamp ? (
              <img
                src={imagemComTimestamp}
                alt={nome}
                className="w-full h-full object-cover"
                title={`Imagem do item: ${nome}`}
              />
            ) : (
              <Package className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden" data-test="text-info">
            <h3
              className="text-base font-semibold text-foreground leading-tight truncate"
              title={`${nome}`}
              data-test="component-name"
            >
              {nome}
            </h3>
            <p
              className="text-sm font-medium tracking-[0.03em] text-muted-foreground truncate mt-0.5"
              title={`${categoriaFormatada}`}
              data-test="component-category"
            >
              {categoriaFormatada}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((v) => !v);
          }}
          className="relative w-8 h-8 flex items-center justify-center shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
          title={isMenuOpen ? 'Fechar ações' : 'Ações do item'}
          data-test="actions-menu-button"
        >
          <MoreHorizontal
            size={18}
            className={`absolute transition-all duration-200 ease-out ${
              isMenuOpen
                ? 'opacity-0 scale-50 rotate-45'
                : 'opacity-100 scale-100 rotate-0'
            }`}
          />
          <X
            size={18}
            className={`absolute transition-all duration-200 ease-out ${
              isMenuOpen
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-50 -rotate-45'
            }`}
          />
        </button>
      </div>

      <div className="relative mt-auto" style={{ minHeight: '44px' }}>
        <div
          className={`transition-opacity duration-150 ${
            isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div
            className="flex items-center justify-between gap-2 pt-3 overflow-hidden"
            data-test="footer"
          >
            <div
              className="flex flex-col text-sm min-w-0 shrink-0"
              data-test="quantity"
            >
              {metricas}
            </div>

            <div
              className="flex items-center gap-1.5 justify-center flex-1 min-w-0 overflow-hidden px-2"
              data-test="status-container"
            >
              <StatusBadge status={status} data-test="status-badge" />
            </div>

            {acoesRapidas && (
              <div
                className="flex items-center gap-0.5 shrink-0"
                data-test="movement-icons"
              >
                {acoesRapidas}
              </div>
            )}
          </div>
        </div>

        <div
          className={`absolute inset-0 flex items-center gap-2 pt-2 transition-opacity duration-150 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          data-test="action-buttons"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              if (onEdit && id) onEdit(id);
            }}
            className="flex-1 h-11 px-3 text-sm font-semibold text-foreground bg-card border border-border hover:bg-muted/45 rounded-md transition-colors duration-100 cursor-pointer"
            data-test="edit-button"
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              if (onEmprestar && id) onEmprestar(id);
            }}
            disabled={emprestarDesabilitado}
            className={`flex-1 h-11 px-3 text-sm font-semibold rounded-md border transition-colors duration-100 ${
              emprestarDesabilitado
                ? 'opacity-45 cursor-not-allowed text-muted-foreground bg-muted/25 border-border'
                : 'text-foreground bg-card border-border hover:bg-muted/45 cursor-pointer'
            }`}
            title={emprestarDesabilitado ? emprestarTitle : undefined}
            data-test="emprestimo-button"
          >
            Emprestar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              if (onDelete && id) onDelete(id);
            }}
            className="flex-1 h-11 px-3 text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/25 hover:bg-destructive/20 dark:border-destructive/40 dark:hover:bg-destructive/30 rounded-md transition-colors duration-100 cursor-pointer"
            data-test="delete-button"
          >
            Excluir
          </button>
        </div>
      </div>

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
