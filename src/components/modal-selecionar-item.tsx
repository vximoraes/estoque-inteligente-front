'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { Input } from '@/components/ui/input';
import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { ApiResponse } from '@/types/itens';
import { PulseLoader } from 'react-spinners';
import ItemCardSimples from './item-card';
import ModalFiltros from './modal-filtros';

interface ModalSelecionarItemProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (itemId: string, itemNome: string) => void;
  onSelectMultiple?: (itens: Array<{ id: string; nome: string }>) => void;
  selectedItemId?: string;
  multiSelect?: boolean;
}

export default function ModalSelecionarItem({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  selectedItemId,
  multiSelect = false,
}: ModalSelecionarItemProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(
    selectedItemId || null,
  );
  const [tempSelectedNome, setTempSelectedNome] = useState<string>('');
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [tempSelectedItems, setTempSelectedComponents] = useState<
    Map<string, string>
  >(new Map());
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFiltrosModalOpen, setIsFiltrosModalOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data: itensData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['itens-modal', searchTerm, categoriaFilter, statusFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      if (categoriaFilter) params.append('categoria', categoriaFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '24');
      params.append('page', pageParam.toString());

      return await get<ApiResponse>(`/itens?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!observerTarget.current || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isOpen) {
      if (multiSelect) {
        setTempSelectedIds(new Set());
        setTempSelectedComponents(new Map());
      } else {
        setTempSelectedId(selectedItemId || null);
      }
      setSearchTerm('');
      setCategoriaFilter('');
      setStatusFilter('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedItemId, multiSelect]);

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

  const itensLista = itensData?.pages
    ? itensData.pages.flatMap((page) => page.data.docs)
    : [];

  const handleCardClick = (id: string, nome: string) => {
    if (multiSelect) {
      const newSelectedIds = new Set(tempSelectedIds);
      const newSelectedComponents = new Map(tempSelectedItems);

      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
        newSelectedComponents.delete(id);
      } else {
        newSelectedIds.add(id);
        newSelectedComponents.set(id, nome);
      }

      setTempSelectedIds(newSelectedIds);
      setTempSelectedComponents(newSelectedComponents);
    } else {
      setTempSelectedId(id);
      setTempSelectedNome(nome);
    }
  };

  const handleConfirmar = () => {
    if (multiSelect) {
      if (tempSelectedIds.size > 0 && onSelectMultiple) {
        const itens = Array.from(tempSelectedItems.entries()).map(
          ([id, nome]) => ({
            id,
            nome,
          }),
        );
        onSelectMultiple(itens);
        onClose();
      }
    } else {
      if (tempSelectedId && tempSelectedNome && onSelect) {
        onSelect(tempSelectedId, tempSelectedNome);
        onClose();
      }
    }
  };

  const modalContent = (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        data-test="modal-selecionar-itens"
        zIndex={99999}
        contentClassName="max-w-lg max-h-[80vh] flex flex-col overflow-visible"
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Header e Barra de pesquisa */}
        <div className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {multiSelect ? 'Selecionar Itens' : 'Selecionar Item'}
            </h2>
            {multiSelect && tempSelectedIds.size > 0 && (
              <p
                className="text-sm text-muted-foreground mt-1"
                data-test="contador-selecionados"
              >
                {tempSelectedIds.size} item
                {tempSelectedIds.size > 1 ? 's' : ''} selecionado
                {tempSelectedIds.size > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Pesquisar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10"
                data-test="modal-search-input"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => setIsFiltrosModalOpen(true)}
              data-test="modal-selecionar-item-filtros-button"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>

          {/* Grid de itens */}
          <div className="overflow-y-auto max-h-[45vh] -mx-6 px-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <PulseLoader color="#0f1419" size={12} />
              </div>
            ) : itensLista.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4" data-test="itens-grid">
                  {itensLista.map((item, idx) => (
                    <ItemCardSimples
                      key={item._id}
                      id={item._id}
                      nome={item.nome}
                      categoria={item.categoria.nome}
                      imagem={item.imagem}
                      onClick={handleCardClick}
                      isSelected={
                        multiSelect
                          ? tempSelectedIds.has(item._id)
                          : tempSelectedId === item._id
                      }
                      dataTestId={`item-selecao-card-${idx}`}
                    />
                  ))}
                </div>
                <div ref={observerTarget} className="h-4 mt-4" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <PulseLoader color="#0f1419" size={8} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>Nenhum item encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer com botões */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-sm">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={
                multiSelect ? tempSelectedIds.size === 0 : !tempSelectedId
              }
              className="h-11 flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#0f1419' }}
              data-test="botao-confirmar-selecao"
            >
              {multiSelect && tempSelectedIds.size > 0
                ? `Adicionar ${tempSelectedIds.size} item${tempSelectedIds.size > 1 ? 's' : ''}`
                : 'Confirmar'}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalFiltros
        isOpen={isFiltrosModalOpen}
        onClose={() => setIsFiltrosModalOpen(false)}
        categoriaFilter={categoriaFilter}
        statusFilter={statusFilter}
        onFiltersChange={(categoria, status) => {
          setCategoriaFilter(categoria);
          setStatusFilter(status);
        }}
      />
    </>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
