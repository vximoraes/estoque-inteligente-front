"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import Cabecalho from "@/components/cabecalho"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { get, post } from '@/lib/fetchData'
import { Plus, Minus, Trash2, ChevronDown } from 'lucide-react'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ItemOrcamento } from '@/types/orcamentos'
import { ApiResponse } from '@/types/itens'
import { FornecedorApiResponse } from '@/types/fornecedores'
import { PulseLoader } from 'react-spinners'
import ModalSelecionarItem from '@/components/modal-selecionar-item'

export default function AdicionarOrcamentoPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [itens, setItens] = useState<ItemOrcamento[]>([])
  const [errors, setErrors] = useState<{ nome?: string }>({})

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isFornecedorDropdownOpen, setIsFornecedorDropdownOpen] = useState<number | null>(null)
  const [fornecedorPesquisa, setFornecedorPesquisa] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const observerTargetFornecedor = useRef<HTMLDivElement>(null)
  const fornecedorButtonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const {
    data: fornecedoresData,
    isLoading: isLoadingFornecedores,
    fetchNextPage: fetchNextPageFornecedores,
    hasNextPage: hasNextPageFornecedores,
    isFetchingNextPage: isFetchingNextPageFornecedores
  } = useInfiniteQuery({
    queryKey: ['fornecedores-infinite', fornecedorPesquisa],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (fornecedorPesquisa) params.append('nome', fornecedorPesquisa);
      params.append('limit', '20');
      params.append('page', pageParam.toString());

      return await get<FornecedorApiResponse>(`/fornecedores?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isFornecedorDropdownOpen !== null,
  })

  useEffect(() => {
    if (!observerTargetFornecedor.current || isFornecedorDropdownOpen === null) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPageFornecedores && !isFetchingNextPageFornecedores) {
          fetchNextPageFornecedores();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTargetFornecedor.current);
    return () => observer.disconnect();
  }, [isFornecedorDropdownOpen, hasNextPageFornecedores, isFetchingNextPageFornecedores, fetchNextPageFornecedores]);

  const createOrcamentoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await post('/orcamentos', data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
      toast.success('Orçamento criado com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
      router.push(`/orcamentos?success=created&id=${data.data._id}`)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao criar orçamento'
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      setErrors({ nome: 'Nome é obrigatório' })
      return
    }

    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
      return
    }

    const itensInvalidos = itens.filter(c => !c.item || !c.fornecedor)
    if (itensInvalidos.length > 0) {
      toast.error('Preencha todos os campos do(s) item(ns).', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
      return
    }

    const orcamentoData = {
      nome,
      descricao: descricao || undefined,
      itens: itens.map(c => ({
        item: c.item,
        fornecedor: c.fornecedor,
        quantidade: c.quantidade,
        valor_unitario: c.valor_unitario
      }))
    }
    createOrcamentoMutation.mutate(orcamentoData)
  }

  const handleAdicionarItem = () => {
    setIsItemModalOpen(true)
  }

  const handleAdicionarItensMultiplos = (itensSelecionados: Array<{ id: string; nome: string }>) => {
    const novosItens = itensSelecionados.map(comp => ({
      item: comp.id,
      nome: comp.nome,
      fornecedor: '',
      quantidade: 1,
      valor_unitario: 0,
      subtotal: 0
    }))
    setItens([...itens, ...novosItens])
  }

  const handleRemoverItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index)
    setItens(novosItens)
  }


  const handleFornecedorSelect = (index: number, fornecedorId: string, fornecedorNome: string) => {
    const novosItens = [...itens]
    novosItens[index].fornecedor = fornecedorId
    novosItens[index].fornecedor_nome = fornecedorNome
    setItens(novosItens)
    setIsFornecedorDropdownOpen(null)
    setFornecedorPesquisa('')
    setDropdownPosition(null)
  }

  const handleOpenFornecedorDropdown = (index: number) => {
    const button = fornecedorButtonRefs.current[index]
    if (button) {
      const rect = button.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
      setIsFornecedorDropdownOpen(index)
      setFornecedorPesquisa('')
    }
  }

  const handleQuantidadeChange = (index: number, delta: number) => {
    const novosItens = [...itens]
    const novaQuantidade = Math.max(1, novosItens[index].quantidade + delta)
    novosItens[index].quantidade = novaQuantidade
    novosItens[index].subtotal = novaQuantidade * novosItens[index].valor_unitario
    setItens(novosItens)
  }

  const handleValorUnitarioChange = (index: number, valor: string) => {
    const novosItens = [...itens]
    const valorNumerico = parseFloat(valor) || 0
    novosItens[index].valor_unitario = valorNumerico
    novosItens[index].subtotal = novosItens[index].quantidade * valorNumerico
    setItens(novosItens)
  }

  const calcularTotal = () => {
    return itens.reduce((total, comp) => total + comp.subtotal, 0)
  }

  const handleCancel = () => {
    router.push('/orcamentos')
  }

  const fornecedoresLista = fornecedoresData?.pages ? fornecedoresData.pages.flatMap(page => page.data.docs) : []

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]') && !target.closest('[data-dropdown-portal]')) {
        setIsFornecedorDropdownOpen(null)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (isFornecedorDropdownOpen !== null) {
        const button = fornecedorButtonRefs.current[isFornecedorDropdownOpen]
        if (button) {
          const rect = button.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          })
        }
      }
    }

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isFornecedorDropdownOpen])

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Cabecalho pagina="Orçamentos" acao="Adicionar" />

      <div className="flex-1 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6 flex flex-col overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 sm:p-4 md:p-8 flex flex-col gap-3 sm:gap-4 md:gap-6 overflow-hidden">
              {/* Nome */}
              <div className="shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="nome" className="text-sm md:text-base font-medium text-gray-900">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {nome.length}/100
                  </span>
                </div>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Projeto - Horta Automatizada"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    if (errors.nome) {
                      setErrors(prev => ({ ...prev, nome: undefined }))
                    }
                  }}
                  maxLength={100}
                  className={`w-full !px-3 sm:!px-4 !h-auto !min-h-[38px] sm:!min-h-[46px] text-sm sm:text-base ${errors.nome ? '!border-red-500' : ''}`}
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.nome}</p>
                )}
              </div>

              {/* Descrição */}
              <div className="shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="descricao" className="text-sm md:text-base font-medium text-gray-900">
                    Descrição
                  </Label>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {descricao.length}/10000
                  </span>
                </div>
                <textarea
                  id="descricao"
                  placeholder="Desenvolvimento de uma horta automatizada por arduino."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px]"
                  maxLength={10000}
                />
              </div>

              {/* Itens do orçamento */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <Label className="text-sm md:text-base font-medium text-gray-900">Itens do orçamento</Label>
                  <Button
                    type="button"
                    onClick={handleAdicionarItem}
                    className="flex items-center gap-2 text-white hover:bg-green-500 cursor-pointer bg-green-600 text-sm sm:text-base px-3 sm:px-4"
                    data-test="botao-adicionar-item"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Adicionar item</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </div>

                {/* Tabela */}
                <div className="border rounded-t-lg bg-white flex-1 flex flex-col overflow-hidden" data-test="tabela-itens-orcamento">
                  {itens.length === 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-xs sm:text-sm min-w-[600px]">
                          <thead className="bg-gray-50 z-10 shadow-sm">
                            <tr className="bg-gray-50 border-b">
                              <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">NOME</th>
                              <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">FORNECEDOR</th>
                              <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">QUANTIDADE</th>
                              <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">VALOR UNITÁRIO</th>
                              <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">SUBTOTAL</th>
                              <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">AÇÕES</th>
                            </tr>
                          </thead>
                        </table>
                      </div>
                      <div className="flex-1 flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                        Nenhum item adicionado.
                      </div>
                    </>
                  ) : (
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full caption-bottom text-xs sm:text-sm min-w-[800px]">
                        <colgroup>
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                        </colgroup>
                      <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                        <tr className="bg-gray-50 border-b">
                          <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">NOME</th>
                          <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">FORNECEDOR</th>
                          <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">QUANTIDADE</th>
                          <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">VALOR UNITÁRIO</th>
                          <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">SUBTOTAL</th>
                          <th className="font-semibold text-gray-700 bg-gray-50 text-center px-4 py-3">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((comp, index) => (
                          <tr key={index} className="hover:bg-gray-50 border-b">
                            {/* Nome */}
                            <td className="px-4 py-3">
                              <div className="px-3 py-2">
                                <span className="text-sm font-semibold text-gray-900 truncate block" title={comp.nome}>
                                  {comp.nome}
                                </span>
                              </div>
                            </td>

                            {/* Fornecedor */}
                            <td className="px-4 py-3">
                              <div className="relative" data-dropdown>
                                <button
                                  ref={(el) => { fornecedorButtonRefs.current[index] = el }}
                                  type="button"
                                  onClick={() => {
                                    if (isFornecedorDropdownOpen === index) {
                                      setIsFornecedorDropdownOpen(null)
                                      setDropdownPosition(null)
                                      setFornecedorPesquisa('')
                                    } else {
                                      handleOpenFornecedorDropdown(index)
                                    }
                                  }}
                                  className="w-full h-[38px] flex items-center justify-between px-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                                  data-test="select-fornecedor"
                                >
                                  <span className={`truncate ${comp.fornecedor_nome ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {comp.fornecedor_nome || 'Selecione'}
                                  </span>
                                  <ChevronDown className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                                </button>
                              </div>
                            </td>

                            {/* Quantidade */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuantidadeChange(index, -1)}
                                  className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                                  disabled={comp.quantidade <= 1}
                                  data-test="botao-decrementar"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  value={comp.quantidade}
                                  onChange={(e) => {
                                    const novosItens = [...itens]
                                    novosItens[index].quantidade = Math.max(1, parseInt(e.target.value) || 1)
                                    novosItens[index].subtotal = novosItens[index].quantidade * novosItens[index].valor_unitario
                                    setItens(novosItens)
                                  }}
                                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md"
                                  min="1"
                                  data-test="input-quantidade"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantidadeChange(index, 1)}
                                  className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                                  data-test="botao-incrementar"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                            {/* Valor Unitário */}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={comp.valor_unitario}
                                onChange={(e) => handleValorUnitarioChange(index, e.target.value)}
                                className="w-full px-3 py-2 text-center border border-gray-300 rounded-md"
                                placeholder="R$0,00"
                                step="0.01"
                                min="0"
                                data-test="input-valor-unitario"
                              />
                            </td>

                            {/* Subtotal */}
                            <td className="px-4 py-3 text-center text-gray-900 font-medium" data-test="subtotal">
                              R${comp.subtotal.toFixed(2)}
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-3">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoverItem(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Remover item"
                                  data-test="botao-remover-item"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-x border-b rounded-b-lg bg-gray-50 px-4 py-3 shrink-0">
                  <div className="text-center font-semibold text-gray-700 text-sm sm:text-base" data-test="total-orcamento">
                    Total: R${calcularTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex justify-end gap-2 sm:gap-3 px-4 md:px-8 py-3 sm:py-4 border-t bg-gray-50 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="min-w-[80px] sm:min-w-[120px] cursor-pointer text-sm sm:text-base px-3 sm:px-4"
                data-test="botao-cancelar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="min-w-[80px] sm:min-w-[120px] text-white cursor-pointer hover:opacity-90 text-sm sm:text-base px-3 sm:px-4"
                style={{ backgroundColor: '#306FCC' }}
                disabled={createOrcamentoMutation.isPending}
              >
                {createOrcamentoMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />

      {/* Modal de Seleção de Itens */}
      <ModalSelecionarItem
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSelectMultiple={handleAdicionarItensMultiplos}
        multiSelect={true}
      />

      {/* Dropdown de Fornecedor */}
      {isFornecedorDropdownOpen !== null && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          data-dropdown-portal
          data-test="dropdown-fornecedores"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999
          }}
          className="mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col"
        >
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={fornecedorPesquisa}
              onChange={(e) => setFornecedorPesquisa(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
              data-test="dropdown-search-input"
            />
          </div>
          <div className="overflow-y-auto" data-test="fornecedores-list">
            {isLoadingFornecedores ? (
              <div className="flex justify-center py-4">
                <PulseLoader color="#306FCC" size={8} />
              </div>
            ) : fornecedoresLista.length > 0 ? (
              <>
                {fornecedoresLista.map((fornecedor, idx) => (
                  <button
                    key={fornecedor._id}
                    type="button"
                    onClick={() => handleFornecedorSelect(isFornecedorDropdownOpen, fornecedor._id, fornecedor.nome)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm cursor-pointer"
                    data-test={`fornecedor-option-${idx}`}
                  >
                    {fornecedor.nome}
                  </button>
                ))}
                <div ref={observerTargetFornecedor} className="h-1" />
                {isFetchingNextPageFornecedores && (
                  <div className="flex justify-center py-2">
                    <PulseLoader color="#306FCC" size={6} />
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Nenhum fornecedor encontrado
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
