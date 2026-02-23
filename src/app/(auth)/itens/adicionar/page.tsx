"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, ChevronDown, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Cabecalho from "@/components/cabecalho"
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { get, post } from '@/lib/fetchData'
import { getSession } from 'next-auth/react'
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import ModalEditarCategoria from '@/components/modal-editar-categoria'
import ModalExcluirCategoria from '@/components/modal-excluir-categoria'
import { PulseLoader } from 'react-spinners'

interface Categoria {
  _id: string
  nome: string
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

interface ItemPost {
  data: {
    _id: string,
    imagem?: string
  }
}

export default function AdicionarItemPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [descricao, setDescricao] = useState('')
  const [imagem, setImagem] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [isAddingCategoria, setIsAddingCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [isCategoriaDropdownOpen, setIsCategoriaDropdownOpen] = useState(false)
  const [categoriaPesquisa, setCategoriaPesquisa] = useState('')
  const [errors, setErrors] = useState<{ nome?: string; categoria?: string; novaCategoria?: string }>({})
  const [isDragging, setIsDragging] = useState(false)
  const [idItem, setIdItem] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [isEditarCategoriaModalOpen, setIsEditarCategoriaModalOpen] = useState(false)
  const [isExcluirCategoriaModalOpen, setIsExcluirCategoriaModalOpen] = useState(false)
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null)

  const {
    data: categoriasData,
    isLoading: isLoadingCategorias,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['categorias-infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return await get<CategoriasApiResponse>(`/categorias?limit=20&page=${pageParam}`);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
  })

  const createCategoriaMutation = useMutation({
    mutationFn: async (nomeCategoria: string) => {
      return await post('/categorias', { nome: nomeCategoria });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-infinite'] })
      setCategoriaId(data.data._id)
      setNovaCategoria('')
      setIsAddingCategoria(false)
      setErrors(prev => ({ ...prev, novaCategoria: undefined }))
      toast.success('Categoria criada com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message
      setErrors(prev => ({ ...prev, novaCategoria: errorMessage }))
    }
  })

  const sendItemImagem = useMutation({
    mutationFn: async (itemId: string) => {
      if (imagem) {
        let formData = new FormData()
        formData.append('file', imagem)
        const session = await getSession();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/itens/${itemId}/foto`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          },
          body: formData
        });
        return await response.json();
      }
      return null
    },
    onSuccess: (data: any) => {
      if (data?.data.imagem) {
        console.log('Imagem enviada com sucesso:', data.data.imagem)
      }
      // Invalida as queries e navega após o upload da imagem
      queryClient.invalidateQueries({ queryKey: ['itens'] })
      // Adiciona timestamp para forçar recarregamento da imagem (cache busting)
      const timestamp = Date.now()
      router.push(`/itens?success=created&t=${timestamp}`)
    },
    onError: (error: any) => {
      console.log("Erro ao enviar imagem:", error)
      toast.error('Erro ao fazer upload da imagem.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
      // Mesmo com erro na imagem, navega de volta (item já foi criado)
      const timestamp = Date.now()
      router.push(`/itens?success=created&t=${timestamp}`)
    }
  })

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await post<ItemPost>('/itens', data);
    },
    onSuccess: (data: any) => {
      const novoItemId = data.data._id
      setIdItem(novoItemId)
      queryClient.invalidateQueries({ queryKey: ['itens'] })

      // Se há imagem para enviar, envia usando o ID retornado
      if (imagem) {
        sendItemImagem.mutate(novoItemId)
      } else {
        // Se não há imagem, navega direto com timestamp para forçar refetch
        const timestamp = Date.now()
        router.push(`/itens?success=created&t=${timestamp}`)
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Erro ao criar item';

      if (error?.response?.data) {
        const errorData = error.response.data;

        // Priorizar mensagens do array errors
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const messages = errorData.errors.map((err: any) => err.message).filter(Boolean);
          if (messages.length > 0) {
            errorMessage = messages.join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagem(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagemPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagem(null)
    setImagemPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        setImagem(file)

        const reader = new FileReader()
        reader.onloadend = () => {
          setImagemPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { nome?: string; categoria?: string } = {}

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!categoriaId) {
      newErrors.categoria = 'Selecione uma categoria'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const itemData: any = {
      nome: nome,
      categoria: categoriaId,
      estoque_minimo: estoqueMinimo,
    }

    if (descricao.trim()) {
      itemData.descricao = descricao
    }

    // Não envia o nome da imagem - o backend vai definir como idItem.jpeg após o upload

    createItemMutation.mutate(itemData)
  }

  const handleAddCategoria = () => {
    if (!novaCategoria.trim()) {
      setErrors(prev => ({ ...prev, novaCategoria: 'Nome da categoria é obrigatório' }))
      return
    }
    setErrors(prev => ({ ...prev, novaCategoria: undefined }))
    createCategoriaMutation.mutate(novaCategoria)
  }

  const handleCancel = () => {
    router.push('/itens')
  }

  const handleCategoriaSelect = (categoria: Categoria) => {
    setCategoriaId(categoria._id)
    setIsCategoriaDropdownOpen(false)
    setCategoriaPesquisa('')
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: undefined }))
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-categoria-dropdown]')) {
        setIsCategoriaDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const categorias = categoriasData?.pages ? categoriasData.pages.flatMap(page => page.data.docs) : []
  const categoriasFiltradas = categorias.filter((cat: Categoria) =>
    cat.nome.toLowerCase().includes(categoriaPesquisa.toLowerCase())
  )
  const categoriaSelecionada = categorias.find((cat: Categoria) => cat._id === categoriaId)

  useEffect(() => {
    if (!observerTarget.current || !isCategoriaDropdownOpen) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [isCategoriaDropdownOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Cabecalho pagina="Itens" acao="Adicionar" />

      <div className="flex-1 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6 flex flex-col overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 sm:p-4 md:p-8 flex flex-col gap-3 sm:gap-4 md:gap-6 overflow-y-auto">
              {/* Grid de 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Nome */}
                <div>
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
                    placeholder="Meu Item"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      if (errors.nome) {
                        setErrors(prev => ({ ...prev, nome: undefined }))
                      }
                    }}
                    maxLength={100}
                    className={`w-full !px-3 sm:!px-4 !h-auto !min-h-[38px] sm:!min-h-[46px] text-sm sm:text-base ${errors.nome ? '!border-red-500' : ''}`}
                    data-test="input-nome-item"
                  />
                  {errors.nome && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.nome}</p>
                  )}
                </div>

                {/* Categoria com botão + */}
                <div>
                  <Label className="text-sm md:text-base font-medium text-gray-900 mb-2 block">
                    Categoria <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0" data-categoria-dropdown>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriaDropdownOpen(!isCategoriaDropdownOpen)
                            if (errors.categoria) {
                              setErrors(prev => ({ ...prev, categoria: undefined }))
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 sm:px-4 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer text-sm sm:text-base min-h-[38px] sm:min-h-[46px] ${errors.categoria ? 'border-red-500' : 'border-gray-300'
                            }`}
                          disabled={isLoadingCategorias}
                          data-test="botao-selecionar-categoria"
                        >
                          <span className={`truncate ${categoriaSelecionada ? 'text-gray-900' : 'text-gray-500'}`}>
                            {isLoadingCategorias
                              ? 'Carregando...'
                              : categoriaSelecionada?.nome || 'Selecione uma categoria'
                            }
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isCategoriaDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </button>

                        {/* Dropdown */}
                        {isCategoriaDropdownOpen && !isLoadingCategorias && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 sm:max-h-80 overflow-hidden flex flex-col">
                            {/* Input de pesquisa */}
                            <div className="p-2 sm:p-3 border-b border-gray-200 bg-gray-50">
                              <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={categoriaPesquisa}
                                onChange={(e) => setCategoriaPesquisa(e.target.value)}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onClick={(e) => e.stopPropagation()}
                                data-test="input-pesquisa-categoria"
                              />
                            </div>

                            {/* Lista de categorias */}
                            <div className="overflow-y-auto">
                              {categoriasFiltradas.length > 0 ? (
                                <>
                                  {categoriasFiltradas.map((categoria: Categoria) => (
                                    <div
                                      key={categoria._id}
                                      className={`flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors group ${categoriaId === categoria._id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleCategoriaSelect(categoria)}
                                        className={`flex-1 text-left cursor-pointer text-sm sm:text-base truncate ${categoriaId === categoria._id ? 'text-blue-600 font-medium' : 'text-gray-900'
                                          }`}
                                        title={categoria.nome}
                                      >
                                        {categoria.nome}
                                      </button>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setCategoriaToEdit(categoria)
                                            setIsEditarCategoriaModalOpen(true)
                                          }}
                                          className="p-1.5 text-gray-900 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                          title="Editar categoria"
                                          data-test="botao-editar-categoria"
                                        >
                                          <Edit size={20} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setCategoriaToEdit(categoria)
                                            setIsExcluirCategoriaModalOpen(true)
                                          }}
                                          className="p-1.5 text-gray-900 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                          title="Excluir categoria"
                                          data-test="botao-excluir-categoria"
                                        >
                                          <Trash2 size={20} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {/* Infinite scroll trigger */}
                                  <div ref={observerTarget} className="h-1" />
                                  {/* Loading indicator */}
                                  {isFetchingNextPage && (
                                    <div className="flex justify-center py-4">
                                      <PulseLoader color="#306FCC" size={8} />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                                  Nenhuma categoria encontrada
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setIsAddingCategoria(true)}
                        className="text-white !h-[38px] !w-[38px] sm:!h-[46px] sm:!w-[46px] !p-0 flex items-center justify-center cursor-pointer hover:opacity-90 flex-shrink-0"
                        style={{ backgroundColor: '#306FCC' }}
                        data-test="botao-adicionar-categoria"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                    {errors.categoria && (
                      <p className="text-red-500 text-xs sm:text-sm">{errors.categoria}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Estoque mínimo */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="estoqueMinimo" className="text-sm md:text-base font-medium text-gray-900">
                      Estoque mínimo
                    </Label>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {estoqueMinimo.length}/9
                    </span>
                  </div>
                  <Input
                    id="estoqueMinimo"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={estoqueMinimo}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 9) {
                        setEstoqueMinimo(value);
                      }
                    }}
                    className="w-full !px-3 sm:!px-4 !h-auto !min-h-[38px] sm:!min-h-[46px] text-sm sm:text-base"
                    data-test="input-estoque-minimo"
                  />
                </div>

                {/* Imagem */}
                <div>
                  <Label className="text-sm md:text-base font-medium text-gray-900 mb-2 block">
                    Imagem
                  </Label>
                  {imagemPreview ? (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-md min-h-[38px] sm:min-h-[46px] flex items-center px-3 sm:px-4 bg-gray-50">
                      <div className="flex items-center gap-2 sm:gap-3 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img
                            src={imagemPreview}
                            alt="Preview"
                            className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded"
                          />
                          <span className="text-xs sm:text-sm text-gray-700 truncate">Imagem selecionada</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-all duration-200 cursor-pointer"
                          aria-label="Remover imagem"
                          data-test="botao-remover-imagem"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-md min-h-[38px] sm:min-h-[46px] flex items-center justify-center px-3 sm:px-4 transition-all cursor-pointer ${isDragging
                        ? 'border-[#306FCC] bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                    >
                      <p className="text-center text-xs sm:text-sm">
                        <span className="font-semibold text-[#306FCC]">Adicione ou arraste</span>{' '}
                        <span className="text-gray-600"> sua imagem aqui.</span>
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    name="file"
                  />
                </div>
              </div>

              {/* Descrição - largura total */}
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="descricao" className="text-sm md:text-base font-medium text-gray-900">
                    Descrição
                  </Label>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {descricao.length}/200
                  </span>
                </div>
                <textarea
                  id="descricao"
                  placeholder="Item para projeto..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={200}
                  className="w-full flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px]"
                  data-test="textarea-descricao-item"
                />
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex justify-end gap-2 sm:gap-3 px-4 md:px-8 py-3 sm:py-4 border-t bg-gray-50 flex-shrink-0">
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
                disabled={createItemMutation.isPending}
                data-test="botao-salvar"
              >
                {createItemMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal para adicionar categoria */}
      {isAddingCategoria && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-3 sm:p-4"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddingCategoria(false)
              setNovaCategoria('')
              setErrors(prev => ({ ...prev, novaCategoria: undefined }))
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <div className="relative p-4 sm:p-6 pb-0">
              <button
                onClick={() => {
                  setIsAddingCategoria(false)
                  setNovaCategoria('')
                  setErrors(prev => ({ ...prev, novaCategoria: undefined }))
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                title="Fechar"
                data-test="botao-fechar-modal-categoria"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
              <div className="text-center pt-2 sm:pt-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                  Nova Categoria
                </h2>
              </div>

              {/* Campo Nome da Categoria */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="novaCategoria" className="block text-sm sm:text-base font-medium text-gray-700">
                    Nome da Categoria <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {novaCategoria.length}/100
                  </span>
                </div>
                <input
                  id="novaCategoria"
                  type="text"
                  placeholder="Digite o nome da categoria"
                  value={novaCategoria}
                  onChange={(e) => {
                    setNovaCategoria(e.target.value)
                    if (errors.novaCategoria) {
                      setErrors(prev => ({ ...prev, novaCategoria: undefined }))
                    }
                  }}
                  maxLength={100}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${errors.novaCategoria ? 'border-red-500' : 'border-gray-300'
                    }`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategoria()
                    }
                  }}
                  data-test="input-nova-categoria"
                />
                {errors.novaCategoria && (
                  <p className="text-red-500 text-xs sm:text-sm">{errors.novaCategoria}</p>
                )}
              </div>
            </div>

            {/* Footer com ações */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingCategoria(false)
                    setNovaCategoria('')
                    setErrors(prev => ({ ...prev, novaCategoria: undefined }))
                  }}
                  disabled={createCategoriaMutation.isPending}
                  className="flex-1 cursor-pointer text-sm sm:text-base"
                  data-test="botao-cancelar-modal-categoria"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddCategoria}
                  disabled={createCategoriaMutation.isPending}
                  className="flex-1 text-white hover:opacity-90 cursor-pointer text-sm sm:text-base"
                  style={{ backgroundColor: '#306FCC' }}
                  data-test="botao-criar-categoria"
                >
                  {createCategoriaMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Categoria */}
      {categoriaToEdit && (
        <>
          <ModalEditarCategoria
            isOpen={isEditarCategoriaModalOpen}
            onClose={() => {
              setIsEditarCategoriaModalOpen(false)
              setCategoriaToEdit(null)
            }}
            categoriaId={categoriaToEdit._id}
            categoriaNome={categoriaToEdit.nome}
            onSuccess={() => setIsCategoriaDropdownOpen(false)}
          />
          <ModalExcluirCategoria
            isOpen={isExcluirCategoriaModalOpen}
            onClose={() => {
              setIsExcluirCategoriaModalOpen(false)
              setCategoriaToEdit(null)
            }}
            categoriaId={categoriaToEdit._id}
            categoriaNome={categoriaToEdit.nome}
            onSuccess={() => setIsCategoriaDropdownOpen(false)}
          />
        </>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />
    </div>
  )
}
