"use client"
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useInfiniteQuery } from '@tanstack/react-query'
import { get } from '@/lib/fetchData'
import { ApiResponse } from '@/types/componentes'
import { PulseLoader } from 'react-spinners'
import ComponenteCardSimples from './componente-card'

interface ModalSelecionarComponenteProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (componenteId: string, componenteNome: string) => void
  onSelectMultiple?: (componentes: Array<{ id: string; nome: string }>) => void
  selectedComponenteId?: string
  multiSelect?: boolean
}

export default function ModalSelecionarComponente({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  selectedComponenteId,
  multiSelect = false
}: ModalSelecionarComponenteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(selectedComponenteId || null)
  const [tempSelectedNome, setTempSelectedNome] = useState<string>('')
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set())
  const [tempSelectedComponents, setTempSelectedComponents] = useState<Map<string, string>>(new Map())
  const observerTarget = useRef<HTMLDivElement>(null)

  const {
    data: componentesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['componentes-modal', searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nome', searchTerm);
      params.append('limit', '24');
      params.append('page', pageParam.toString());

      return await get<ApiResponse>(`/componentes?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen,
  })

  useEffect(() => {
    if (!observerTarget.current || !isOpen) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isOpen) {
      if (multiSelect) {
        setTempSelectedIds(new Set())
        setTempSelectedComponents(new Map())
      } else {
        setTempSelectedId(selectedComponenteId || null)
      }
      setSearchTerm('')
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedComponenteId, multiSelect])

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

  if (!isOpen) return null

  const componentesLista = componentesData?.pages ? componentesData.pages.flatMap(page => page.data.docs) : []

  const handleCardClick = (id: string, nome: string) => {
    if (multiSelect) {
      const newSelectedIds = new Set(tempSelectedIds)
      const newSelectedComponents = new Map(tempSelectedComponents)
      
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
        newSelectedComponents.delete(id)
      } else {
        newSelectedIds.add(id)
        newSelectedComponents.set(id, nome)
      }
      
      setTempSelectedIds(newSelectedIds)
      setTempSelectedComponents(newSelectedComponents)
    } else {
      setTempSelectedId(id)
      setTempSelectedNome(nome)
    }
  }

  const handleConfirmar = () => {
    if (multiSelect) {
      if (tempSelectedIds.size > 0 && onSelectMultiple) {
        const componentes = Array.from(tempSelectedComponents.entries()).map(([id, nome]) => ({
          id,
          nome
        }))
        onSelectMultiple(componentes)
        onClose()
      }
    } else {
      if (tempSelectedId && tempSelectedNome && onSelect) {
        onSelect(tempSelectedId, tempSelectedNome)
        onClose()
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
      data-test="modal-selecionar-componentes"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Header e Barra de pesquisa */}
        <div className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {multiSelect ? 'Selecionar Componentes' : 'Selecionar Componente'}
            </h2>
            {multiSelect && tempSelectedIds.size > 0 && (
              <p className="text-sm text-gray-500 mt-1" data-test="contador-selecionados">
                {tempSelectedIds.size} componente{tempSelectedIds.size > 1 ? 's' : ''} selecionado{tempSelectedIds.size > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar componentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-test="modal-search-input"
            />
          </div>

          {/* Grid de componentes */}
          <div className="overflow-y-auto max-h-[45vh] -mx-6 px-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <PulseLoader color="#306FCC" size={12} />
              </div>
            ) : componentesLista.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" data-test="componentes-grid">
                  {componentesLista.map((componente, idx) => (
                    <ComponenteCardSimples
                      key={componente._id}
                      id={componente._id}
                      nome={componente.nome}
                      categoria={componente.categoria.nome}
                      imagem={componente.imagem}
                      onClick={handleCardClick}
                      isSelected={multiSelect ? tempSelectedIds.has(componente._id) : tempSelectedId === componente._id}
                      dataTestId={`componente-selecao-card-${idx}`}
                    />
                  ))}
                </div>
                <div ref={observerTarget} className="h-4 mt-4" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <PulseLoader color="#306FCC" size={8} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>Nenhum componente encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer com botões */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={multiSelect ? tempSelectedIds.size === 0 : !tempSelectedId}
              className="flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
              data-test="botao-confirmar-selecao"
            >
              {multiSelect && tempSelectedIds.size > 0 
                ? `Adicionar ${tempSelectedIds.size} componente${tempSelectedIds.size > 1 ? 's' : ''}`
                : 'Confirmar'
              }
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

