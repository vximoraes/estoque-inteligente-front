'use client';
import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  MinusCircle,
  Package,
  MoreHorizontal,
  X,
} from 'lucide-react';
import ModalVisualizarImagem from './modal-visualizar-imagem';

interface ItemEstoqueProps {
  id?: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo?: number;
  status: string;
  imagem?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onEntrada?: (id: string) => void;
  onSaida?: (id: string) => void;
  onEmprestar?: (id: string) => void;
  isLoading?: boolean;
  'data-test'?: string;
}

const STATUS_BG: Record<string, string> = {
  'Em Estoque': 'var(--status-success-bg)',
  'Baixo Estoque': 'var(--status-warning-bg)',
  Indisponível: 'var(--status-danger-bg)',
};

const STATUS_TEXT: Record<string, string> = {
  'Em Estoque': 'var(--status-success-text)',
  'Baixo Estoque': 'var(--status-warning-text)',
  Indisponível: 'var(--status-danger-text)',
};

export default function ItemEstoque({
  id = '',
  nome,
  categoria,
  quantidade,
  estoqueMinimo,
  status,
  imagem,
  onEdit,
  onDelete,
  onClick,
  onEntrada,
  onSaida,
  onEmprestar,
  isLoading = false,
  'data-test': dataTest,
}: ItemEstoqueProps) {
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

  const handleEntrada = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEntrada && id) {
      onEntrada(id);
    }
  };

  const handleSaida = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaida && id) {
      onSaida(id);
    }
  };

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

  const componentTitle = `${nome} - ${categoria} - Qtd: ${quantidade} - Status: ${status}`;

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
      title={componentTitle}
      onClick={handleClick}
    >
      {/* Loading overlay */}
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

      {/* Header: image + name/category + actions */}
      <div
        className="flex items-start justify-between mb-3 gap-2 overflow-hidden"
        data-test="header"
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden"
          data-test="component-info"
        >
          {/* Image */}
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

          {/* Name + category */}
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

        {/* Toggle button with animated MoreHorizontal → X crossfade */}
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

      {/* Footer area: footer e actions ocupam o mesmo espaço, com fade entre eles */}
      <div className="relative mt-auto" style={{ minHeight: '44px' }}>
        {/* Normal footer */}
        <div
          className={`transition-opacity duration-150 ${
            isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div
            className="flex items-center justify-between gap-2 pt-3 overflow-hidden"
            data-test="footer"
          >
            {/* Quantity */}
            <div
              className="flex flex-col text-sm min-w-0 shrink-0"
              data-test="quantity"
            >
              <span title={`Quantidade em estoque: ${quantidade} unidades`}>
                <span className="text-muted-foreground font-medium">Qtd</span>
                <span className="font-semibold text-foreground ml-1 tabular-nums text-base">
                  {quantidade}
                </span>
              </span>
              {estoqueMinimo !== undefined && (
                <span
                  className="mt-0.5"
                  title={`Estoque mínimo: ${estoqueMinimo} unidades`}
                >
                  <span className="text-muted-foreground font-medium">Mín</span>
                  <span className="font-semibold text-foreground ml-1 tabular-nums text-base">
                    {estoqueMinimo}
                  </span>
                </span>
              )}
            </div>

            {/* Status indicator */}
            <div
              className="flex items-center gap-1.5 justify-center flex-1 min-w-0 overflow-hidden px-2"
              data-test="status-container"
            >
              <span
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium truncate max-w-full"
                title={`Status atual: ${status}`}
                data-test="status-badge"
                style={{
                  color: STATUS_TEXT[status] || 'var(--muted-foreground)',
                  backgroundColor: STATUS_BG[status] || 'var(--muted)',
                }}
              >
                {status}
              </span>
            </div>

            {/* Movement icons */}
            <div
              className="flex items-center gap-0.5 shrink-0"
              data-test="movement-icons"
            >
              <button
                className="p-1.5 rounded-md hover:bg-muted/40 transition-colors duration-150 cursor-pointer shrink-0"
                title={`Registrar entrada de ${nome}`}
                data-test="entrada-icon"
                onClick={handleEntrada}
              >
                <PlusCircle size={16} className="text-foreground" />
              </button>
              <button
                className={`p-1.5 rounded-md transition-colors duration-150 shrink-0 ${
                  quantidade === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-muted/40 cursor-pointer'
                }`}
                title={
                  quantidade === 0
                    ? `${nome} sem estoque disponível`
                    : `Registrar saída de ${nome}`
                }
                data-test="saida-icon"
                onClick={quantidade === 0 ? undefined : handleSaida}
                disabled={quantidade === 0}
              >
                <MinusCircle
                  size={16}
                  className={
                    quantidade === 0
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                  }
                />
              </button>
            </div>
          </div>
        </div>

        {/* Actions panel — sobrepõe o footer no mesmo espaço */}
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
            disabled={quantidade === 0}
            className={`flex-1 h-11 px-3 text-sm font-semibold rounded-md border transition-colors duration-100 ${
              quantidade === 0
                ? 'opacity-45 cursor-not-allowed text-muted-foreground bg-muted/25 border-border'
                : 'text-foreground bg-card border-border hover:bg-muted/45 cursor-pointer'
            }`}
            title={
              quantidade === 0
                ? `${nome} sem estoque disponível para empréstimo`
                : undefined
            }
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
