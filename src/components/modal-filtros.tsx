import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';

interface Categoria {
  _id: string;
  nome: string;
  usuario: string;
  __v: number;
}

interface CategoriasApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: Categoria[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  errors: any[];
}

interface ModalFiltrosProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaFilter: string;
  statusFilter: string;
  onFiltersChange: (categoria: string, status: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  showCategoria?: boolean;
}

const defaultStatusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'Em Estoque', label: 'Em Estoque' },
  { value: 'Baixo Estoque', label: 'Baixo Estoque' },
  { value: 'Indisponível', label: 'Indisponível' },
];

export default function ModalFiltros({
  isOpen,
  onClose,
  categoriaFilter,
  statusFilter,
  onFiltersChange,
  statusOptions = defaultStatusOptions,
  showCategoria = true,
}: ModalFiltrosProps) {
  const [selectedCategoria, setSelectedCategoria] = useState(categoriaFilter);
  const [selectedStatus, setSelectedStatus] = useState(statusFilter);
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoriaSearch, setCategoriaSearch] = useState('');

  const { data: categoriasData, isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      return await get<CategoriasApiResponse>(`/categorias?limite=100&page=1`);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setSelectedCategoria(categoriaFilter);
    setSelectedStatus(statusFilter);
  }, [categoriaFilter, statusFilter]);

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
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setCategoriaDropdownOpen(false);
        setStatusDropdownOpen(false);
        setCategoriaSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleApplyFilters = () => {
    onFiltersChange(selectedCategoria, selectedStatus);
    handleCloseModal();
  };

  const handleClearFilters = () => {
    setSelectedCategoria('');
    setSelectedStatus('');
    onFiltersChange('', '');
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setCategoriaDropdownOpen(false);
    setStatusDropdownOpen(false);
    setCategoriaSearch('');
    onClose();
  };

  const categorias = categoriasData?.data?.docs ?? [];
  const categoriaOptions = [
    { value: '', label: 'Todas as categorias' },
    ...categorias.map((cat) => ({ value: cat._id, label: cat.nome })),
  ];

  const filteredCategorias = categoriaOptions.filter((cat) =>
    cat.label.toLowerCase().includes(categoriaSearch.toLowerCase()),
  );

  const getSelectedCategoriaLabel = () => {
    const selected = categoriaOptions.find(
      (opt) => opt.value === selectedCategoria,
    );
    return selected?.label || 'Todas as categorias';
  };

  const getSelectedStatusLabel = () => {
    const selected = statusOptions.find((opt) => opt.value === selectedStatus);
    return selected?.label || 'Todos os status';
  };

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={handleBackdropClick}
      data-test="modal-filtros-backdrop"
    >
      <div
        className="bg-card rounded-sm border border-border shadow-none max-w-lg w-full max-h-[80vh] overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        data-test="modal-filtros-content"
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            title="Fechar"
            data-test="modal-filtros-close-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo dos Filtros */}
        <div className="px-6 pt-4 pb-6 space-y-6">
          {/* Filtro por Categoria - Condicional */}
          {showCategoria && (
            <div className="space-y-2" data-test="filtro-categoria-container">
              <label className="block text-sm font-semibold text-foreground tracking-tight">
                Categoria
              </label>
              <div className="relative" data-dropdown>
                <button
                  onClick={() => {
                    const isOpening = !categoriaDropdownOpen;
                    setCategoriaDropdownOpen(isOpening);
                    setStatusDropdownOpen(false);
                    if (isOpening) {
                      setCategoriaSearch('');
                    }
                  }}
                  disabled={isLoadingCategorias}
                  className="w-full h-11 flex items-center justify-between px-4 bg-card border border-border rounded-md hover:bg-muted/35 focus:outline-none focus:ring-2 focus:ring-[#306FCC]/35 focus:border-[#306FCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  data-test="filtro-categoria-dropdown"
                >
                  <span
                    className={
                      selectedCategoria
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {isLoadingCategorias
                      ? 'Carregando...'
                      : getSelectedCategoriaLabel()}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${categoriaDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {categoriaDropdownOpen && !isLoadingCategorias && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-80 overflow-hidden">
                    {/* Campo de busca dentro do dropdown */}
                    <div className="p-3 border-b border-border bg-muted/20">
                      <input
                        type="text"
                        placeholder="Buscar categoria..."
                        value={categoriaSearch}
                        onChange={(e) => {
                          setCategoriaSearch(e.target.value);
                        }}
                        className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#306FCC]/35 focus:border-[#306FCC]"
                        onClick={(e) => e.stopPropagation()}
                        data-test="filtro-categoria-search-input"
                      />
                    </div>

                    {/* Lista de categorias com scroll */}
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCategorias.length > 0 ? (
                        <>
                          {filteredCategorias.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedCategoria(option.value);
                                setCategoriaDropdownOpen(false);
                                setCategoriaSearch('');
                              }}
                              className={`w-full text-left px-4 py-2 transition-colors ${
                                selectedCategoria === option.value
                                  ? 'bg-[#306FCC]/10 text-[#306FCC]'
                                  : 'text-foreground hover:bg-muted/40'
                              } cursor-pointer`}
                              data-test={`filtro-categoria-option-${option.value || 'todas'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div
                          className="px-4 py-8 text-center text-muted-foreground text-sm"
                          data-test="filtro-categoria-no-results"
                        >
                          Nenhuma categoria encontrada para "{categoriaSearch}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filtro por Status */}
          <div className="space-y-2 pb-4" data-test="filtro-status-container">
            <label className="block text-sm font-semibold text-foreground tracking-tight">
              Status
            </label>
            <div className="relative" data-dropdown>
              <button
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setCategoriaDropdownOpen(false);
                }}
                className="w-full h-11 flex items-center justify-between px-4 bg-card border border-border rounded-md hover:bg-muted/35 focus:outline-none focus:ring-2 focus:ring-[#306FCC]/35 focus:border-[#306FCC] transition-colors cursor-pointer"
                data-test="filtro-status-dropdown"
              >
                <span
                  className={
                    selectedStatus ? 'text-foreground' : 'text-muted-foreground'
                  }
                >
                  {getSelectedStatusLabel()}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {statusDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 transition-colors ${
                        selectedStatus === option.value
                          ? 'bg-[#306FCC]/10 text-[#306FCC]'
                          : 'text-foreground hover:bg-muted/40'
                      } cursor-pointer`}
                      data-test={`filtro-status-option-${option.value.toLowerCase().replace(/\s+/g, '-') || 'todos'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="h-11 flex-1 border-border bg-card text-foreground hover:bg-muted/60 cursor-pointer"
              data-test="limpar-filtros-button"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="h-11 flex-1 text-white font-semibold tracking-tight hover:opacity-95 shadow-sm cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
              data-test="aplicar-filtros-button"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
