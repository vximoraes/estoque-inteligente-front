"use client"

import { useState, useEffect, useRef } from "react"
import { Pencil, X, Camera, User } from "lucide-react"
import Cabecalho from "@/components/cabecalho"
import { useSession } from "@/hooks/use-session"
import { get, patch } from "@/lib/fetchData"
import { toast, ToastContainer, Slide } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, useSession as useNextAuthSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"

interface UsuarioData {
  _id: string
  nome: string
  email: string
  ativo: boolean
  convidadoEm?: string
  ativadoEm?: string
  fotoPerfil?: string
  ultimoAcesso?: string
}

interface UsuarioApiResponse {
  error: boolean
  message: string
  data: UsuarioData
}

interface Notificacao {
  _id: string
  mensagem: string
  data_hora: string
  visualizada: boolean
  usuario: string
}

interface NotificacoesApiResponse {
  error: boolean
  message: string
  data: {
    docs: Notificacao[]
    totalDocs: number
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage: number | null
    prevPage: number | null
  }
}

export default function HomePage() {
  const { user } = useSession()
  const { update: updateSession } = useNextAuthSession()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingFoto, setIsEditingFoto] = useState(false)
  const [userData, setUserData] = useState<UsuarioData | null>(null)
  const [editedNome, setEditedNome] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingNotificacaoId, setLoadingNotificacaoId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'visualizar' | 'excluir' | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [novaFoto, setNovaFoto] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [stats, setStats] = useState({
    totalItens: 0,
    totalMovimentacoes: 0,
    totalOrcamentos: 0
  })

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const response = await get<UsuarioApiResponse>(`/usuarios/${user.id}`)
        setUserData(response.data)
        if (response.data.fotoPerfil) {
          setImagemPreview(response.data.fotoPerfil)
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  const uploadFotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const session = await getSession()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user?.id}/foto`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: formData
      })
      return await response.json()
    },
    onSuccess: async (data: any) => {
      if (data?.data?.fotoPerfil) {
        setImagemPreview(data.data.fotoPerfil)
        if (userData) {
          setUserData({ ...userData, fotoPerfil: data.data.fotoPerfil })
        }
        await updateSession({
          ...user,
          fotoPerfil: data.data.fotoPerfil
        })
        window.dispatchEvent(new Event('userFotoUpdated'))
      }
      queryClient.invalidateQueries({ queryKey: ['usuario', user?.id] })
      toast.success('Foto atualizada com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      })
      setIsEditingFoto(false)
      setNovaFoto(null)
    },
    onError: (error: any) => {
      console.error('Erro ao enviar foto:', error)
      toast.error('Erro ao atualizar foto do perfil', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      })
    }
  })

  const deleteFotoMutation = useMutation({
    mutationFn: async () => {
      const session = await getSession()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user?.id}/foto`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      })
      return await response.json()
    },
    onSuccess: async () => {
      setImagemPreview(null)
      if (userData) {
        setUserData({ ...userData, fotoPerfil: undefined })
      }
      await updateSession({
        ...user,
        fotoPerfil: undefined
      })
      window.dispatchEvent(new Event('userFotoUpdated'))
      queryClient.invalidateQueries({ queryKey: ['usuario', user?.id] })
      toast.success('Foto removida com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      })
      setIsEditingFoto(false)
      setNovaFoto(null)
    },
    onError: (error: any) => {
      console.error('Erro ao deletar foto:', error)
      toast.error('Erro ao remover foto do perfil', {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      })
    }
  })

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return
      
      setIsLoadingStats(true)
      try {
        // Buscar itens do usuário
        const itensResponse = await get<any>('/itens?limite=100')
        const itensDoUsuario = itensResponse.data?.docs?.filter(
          (comp: any) => {
            const compUsuarioId = comp.usuario?._id || comp.usuario
            return compUsuarioId === user.id || String(compUsuarioId) === String(user.id)
          }
        ) || []
        const totalItens = itensDoUsuario.length

        // Buscar movimentações do usuário
        const movimentacoesResponse = await get<any>('/movimentacoes?limite=100')
        const movimentacoesDoUsuario = movimentacoesResponse.data?.docs?.filter(
          (mov: any) => {
            const movUsuarioId = mov.usuario?._id || mov.usuario
            return movUsuarioId === user.id || String(movUsuarioId) === String(user.id)
          }
        ) || []
        const totalMovimentacoes = movimentacoesDoUsuario.length

        // Buscar orçamentos do usuário
        const orcamentosResponse = await get<any>('/orcamentos?limite=100')
        const orcamentosDoUsuario = orcamentosResponse.data?.docs?.filter(
          (orc: any) => {
            const orcUsuarioId = orc.usuario?._id || orc.usuario
            return orcUsuarioId === user.id || String(orcUsuarioId) === String(user.id)
          }
        ) || []
        const totalOrcamentos = orcamentosDoUsuario.length

        setStats({
          totalItens,
          totalMovimentacoes,
          totalOrcamentos
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [user?.id])

  const {
    data: notificacoesData,
    isLoading: isLoadingNotificacoes,
    fetchNextPage: fetchNextNotificacoes,
    hasNextPage: hasNextNotificacoes,
    isFetchingNextPage: isFetchingNextNotificacoes
  } = useInfiniteQuery<NotificacoesApiResponse>({
    queryKey: ['notificacoes', user?.id],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1
      return await get<NotificacoesApiResponse>(`/notificacoes?limite=10&page=${page}`)
    },
    getNextPageParam: (lastPage) => {
      const data = lastPage.data || lastPage
      return data.hasNextPage ? data.nextPage : undefined
    },
    initialPageParam: 1,
    enabled: !!user?.id,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const notificacoes = notificacoesData?.pages.flatMap(page => {
    const data = page.data || page
    return data.docs || []
  }) || []

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextNotificacoes && !isFetchingNextNotificacoes) {
          fetchNextNotificacoes()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasNextNotificacoes, isFetchingNextNotificacoes, fetchNextNotificacoes])

  async function marcarComoVisualizada(notificacaoId: string) {
    setLoadingNotificacaoId(notificacaoId)
    setLoadingAction('visualizar')
    try {
      await patch(`/notificacoes/${notificacaoId}/visualizar`, {})
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] })
      toast.success("Notificação marcada como lida!", {
        position: "bottom-right",
        autoClose: 2000,
      })
    } catch (error) {
      console.error("Erro ao marcar notificação como visualizada:", error)
      toast.error("Erro ao marcar notificação como lida", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setLoadingNotificacaoId(null)
      setLoadingAction(null)
    }
  }

  async function excluirNotificacao(notificacaoId: string, event: React.MouseEvent) {
    event.stopPropagation()
    setLoadingNotificacaoId(notificacaoId)
    setLoadingAction('excluir')
    try {
      await patch(`/notificacoes/${notificacaoId}/inativar`, {})
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] })
      toast.success("Notificação excluída!", {
        position: "bottom-right",
        autoClose: 2000,
      })
    } catch (error) {
      console.error("Erro ao excluir notificação:", error)
      toast.error("Erro ao excluir notificação", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setLoadingNotificacaoId(null)
      setLoadingAction(null)
    }
  }

  async function marcarTodasComoVisualizadas() {
    const naoVisualizadas = notificacoes.filter(n => !n.visualizada)
    
    if (naoVisualizadas.length === 0) {
      toast.info("Todas as notificações já foram lidas", {
        position: "bottom-right",
        autoClose: 2000,
      })
      return
    }

    try {
      // Marcar todas as não visualizadas
      await Promise.all(
        naoVisualizadas.map(notif => 
          patch(`/notificacoes/${notif._id}/visualizar`, {})
        )
      )
      
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] })
      toast.success(`${naoVisualizadas.length} notificação${naoVisualizadas.length > 1 ? 'ões' : ''} marcada${naoVisualizadas.length > 1 ? 's' : ''} como lida${naoVisualizadas.length > 1 ? 's' : ''}`, {
        position: "bottom-right",
        autoClose: 2000,
      })
    } catch (error) {
      console.error("Erro ao marcar todas como visualizadas:", error)
      toast.error("Erro ao marcar notificações como lidas", {
        position: "bottom-right",
        autoClose: 3000,
      })
    }
  }

  function formatTempoRelativo(data: string) {
    const dataNotificacao = new Date(data)
    const agora = new Date()
    const diferencaMs = agora.getTime() - dataNotificacao.getTime()
    const diferencaMinutos = Math.floor(diferencaMs / 60000)
    const diferencaHoras = Math.floor(diferencaMinutos / 60)
    const diferencaDias = Math.floor(diferencaHoras / 24)

    if (diferencaMinutos < 1) return 'Agora'
    if (diferencaMinutos < 60) return `Há ${diferencaMinutos} minuto${diferencaMinutos > 1 ? 's' : ''}`
    if (diferencaHoras < 24) return `Há ${diferencaHoras} hora${diferencaHoras > 1 ? 's' : ''}`
    if (diferencaDias === 1) return 'Ontem'
    if (diferencaDias < 7) return `Há ${diferencaDias} dias`
    if (diferencaDias < 30) return `Há ${Math.floor(diferencaDias / 7)} semana${Math.floor(diferencaDias / 7) > 1 ? 's' : ''}`
    return `Há ${Math.floor(diferencaDias / 30)} mês${Math.floor(diferencaDias / 30) > 1 ? 'es' : ''}`
  }

  function formatDate(dateString?: string) {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  function formatDateTime(dateString?: string) {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    }
    return date.toLocaleDateString("pt-BR")
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNovaFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagemPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
        setNovaFoto(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagemPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSalvarFoto = () => {
    if (novaFoto) {
      uploadFotoMutation.mutate(novaFoto)
    }
  }

  const handleRemoverFoto = () => {
    setIsConfirmRemoveOpen(true)
  }

  const handleConfirmRemoverFoto = () => {
    deleteFotoMutation.mutate()
    setIsConfirmRemoveOpen(false)
  }

  const handleCancelarEdicaoFoto = () => {
    setIsEditingFoto(false)
    setNovaFoto(null)
    if (userData?.fotoPerfil) {
      setImagemPreview(userData.fotoPerfil)
    } else {
      setImagemPreview(null)
    }
  }

  const handleOpenEdit = () => {
    if (userData) {
      setEditedNome(userData.nome)
    }
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedNome("")
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setIsSaving(true)
    try {
      await patch<UsuarioApiResponse>(`/usuarios/${userData._id}`, {
        nome: editedNome
      })

      // Atualiza o estado local
      setUserData({ ...userData, nome: editedNome })

      toast.success("Perfil atualizado com sucesso!", {
        position: 'bottom-right',
        autoClose: 3000,
        transition: Slide,
      })
      setIsEditing(false)
      setEditedNome("")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao atualizar perfil", {
        position: 'bottom-right',
        autoClose: 5000,
        transition: Slide,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col" data-test="loading-perfil-page">
        <Cabecalho pagina="Perfil" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Carregando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="w-full h-screen flex flex-col">
        <Cabecalho pagina="Perfil" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Erro ao carregar dados do usuário</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex flex-col" data-test="perfil-page">
      {/* Cabeçalho */}
      <Cabecalho pagina="Perfil" />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden flex flex-col p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch flex-1 overflow-y-auto">
          {/* Lado esquerdo - Avatar e Info */}
          <aside className="col-span-1 flex">
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col items-center justify-center w-full" data-test="perfil-info-section">
              <div className="relative w-32 h-32 group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center" data-test="perfil-avatar-container">
                  {imagemPreview ? (
                    <img 
                      src={imagemPreview.startsWith('data:') ? imagemPreview : `${imagemPreview}${imagemPreview.includes('?') ? '&' : '?'}t=${Date.now()}`} 
                      alt="avatar"
                      className="w-full h-full object-cover"
                      data-test="perfil-avatar"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-500" data-test="perfil-avatar-placeholder" />
                  )}
                </div>
                <button
                  onClick={() => setIsEditingFoto(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-lg"
                  title="Editar foto"
                  data-test="edit-avatar-button"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mt-4 w-full px-2">
                <h2 className="text-xl font-semibold truncate w-full" title={userData.nome} data-test="perfil-nome">{userData.nome}</h2>
                <p className="text-sm text-gray-500 mt-1 truncate w-full" title={userData.email} data-test="perfil-email">{userData.email}</p>
              </div>

              <button
                onClick={handleOpenEdit}
                className="mt-4 flex items-center gap-2 justify-center text-blue-600 hover:underline transition-all cursor-pointer"
                data-test="edit-perfil-button"
              >
                <Pencil className="w-4 h-4" />
                <span>Editar perfil</span>
              </button>
            </div>
          </aside>

          {/* Estatísticas de uso */}
          <section className="col-span-1 lg:col-span-2 flex">
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col w-full" data-test="estatisticas-section">
              <h3 className="text-lg font-semibold mb-3">Estatísticas de uso</h3>
              <div className="w-full border-t border-gray-200 mb-4"></div>

              {isLoadingStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 content-center" data-test="loading-estatisticas">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-6 px-6 bg-gray-50 rounded-lg text-center animate-pulse">
                      <div className="h-10 bg-gray-300 rounded w-20 mx-auto mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 content-center">
                  <div className="py-6 px-6 bg-gray-50 rounded-lg text-center" data-test="card-total-itens">
                    <p className="text-4xl font-bold text-blue-600 truncate" title={stats.totalItens.toString()} data-test="total-itens-value">{stats.totalItens}</p>
                    <p className="text-sm text-gray-500 mt-3">Itens cadastrados</p>
                  </div>

                  <div className="py-6 px-6 bg-gray-50 rounded-lg text-center" data-test="card-total-movimentacoes">
                    <p className="text-4xl font-bold text-blue-600 truncate" title={stats.totalMovimentacoes.toString()} data-test="total-movimentacoes-value">{stats.totalMovimentacoes}</p>
                    <p className="text-sm text-gray-500 mt-3">Movimentações</p>
                  </div>

                  <div className="py-6 px-6 bg-gray-50 rounded-lg text-center" data-test="card-total-orcamentos">
                    <p className="text-4xl font-bold text-blue-600 truncate" title={stats.totalOrcamentos.toString()} data-test="total-orcamentos-value">{stats.totalOrcamentos}</p>
                    <p className="text-sm text-gray-500 mt-3">Orçamentos</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Notificações */}
          <div className="col-span-1 lg:col-span-3 flex">
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 w-full" data-test="notificacoes-section">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Notificações</h3>
                  {notificacoes.filter(n => !n.visualizada).length > 0 && (
                    <span className="text-base text-blue-600 font-medium" data-test="notificacoes-nao-lidas-count">
                      ({notificacoes.filter(n => !n.visualizada).length})
                    </span>
                  )}
                </div>
                {notificacoes.filter(n => !n.visualizada).length > 0 && (
                  <button
                    onClick={marcarTodasComoVisualizadas}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                    data-test="marcar-todas-lidas-button"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="w-full border-t border-gray-200"></div>

              <div className="max-h-60 overflow-y-auto">
                {isLoadingNotificacoes ? (
                  <div className="divide-y divide-gray-200 w-full" data-test="loading-notificacoes">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="px-3 py-3 animate-pulse">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full shrink-0 mt-1.5"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notificacoes.length > 0 ? (
                  <div className="divide-y divide-gray-200 w-full" data-test="notificacoes-list">
                    {notificacoes.map((notificacao) => {
                      const isLoadingThis = loadingNotificacaoId === notificacao._id
                      const loadingMessage = isLoadingThis 
                        ? (loadingAction === 'excluir' ? 'Excluindo...' : 'Marcando como lida...') 
                        : notificacao.mensagem
                      return (
                        <div 
                          key={notificacao._id} 
                          className={`px-3 py-3 ${notificacao.visualizada ? 'bg-white' : 'bg-gray-50'} ${isLoadingThis ? 'opacity-50 cursor-wait' : ''} transition-colors hover:bg-gray-100 group`}
                          data-test={`notificacao-item-${notificacao._id}`}
                        >
                          <div className="flex items-start gap-2">
                            {!notificacao.visualizada && (
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5" data-test="notificacao-nao-lida-indicator"></div>
                            )}
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => !notificacao.visualizada && !isLoadingThis && marcarComoVisualizada(notificacao._id)}
                              data-test="notificacao-marcar-lida-area"
                            >
                              <p className={`text-sm text-gray-700 ${notificacao.visualizada ? '' : 'font-medium'}`} data-test="notificacao-mensagem">
                                {loadingMessage}
                                {!isLoadingThis && (
                                  <span className="text-sm text-gray-500 font-normal ml-2" data-test="notificacao-tempo-relativo">
                                    - {formatTempoRelativo(notificacao.data_hora)}
                                  </span>
                                )}
                              </p>
                            </div>
                            {!isLoadingThis && (
                              <button
                                onClick={(e) => excluirNotificacao(notificacao._id, e)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-md cursor-pointer"
                                title="Excluir notificação"
                                data-test="notificacao-excluir-button"
                              >
                                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={observerTarget} className="h-2" />
                    {isFetchingNextNotificacoes && (
                      <div className="px-3 py-3 text-center" data-test="loading-more-notificacoes">
                        <p className="text-sm text-gray-500">Carregando mais...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-60" data-test="no-notificacoes-message">
                    <p className="text-sm text-gray-500">Nenhuma notificação</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* painel de edição */}
      {isEditing && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => setIsEditing(false)}
          data-test="modal-edit-perfil"
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={handleCancelEdit}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                title="Fechar"
                data-test="modal-edit-perfil-close-button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4 px-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Editar perfil
                </h2>
              </div>

              <form onSubmit={handleSaveEdit} id="edit-profile-form" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="nome" className="block text-sm sm:text-base font-medium text-gray-700">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {editedNome.length}/100
                    </span>
                  </div>
                  <input
                    id="nome"
                    type="text"
                    value={editedNome}
                    onChange={e => setEditedNome(e.target.value)}
                    maxLength={100}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={isSaving}
                    data-test="input-nome"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userData?.email || ''}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 border border-gray-300 rounded-md text-sm sm:text-base text-gray-500 cursor-not-allowed"
                    disabled
                    data-test="input-email"
                  />
                </div>
              </form>
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 cursor-pointer"
                  data-test="cancel-edit-perfil-button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="edit-profile-form"
                  disabled={isSaving}
                  className="flex-1 text-white hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: '#306FCC' }}
                  data-test="save-perfil-button"
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de foto */}
      {isEditingFoto && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={handleCancelarEdicaoFoto}
          data-test="modal-edit-foto"
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={handleCancelarEdicaoFoto}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                title="Fechar"
                data-test="modal-edit-foto-close-button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4 px-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Editar foto do perfil
                </h2>
              </div>

              {/* Preview da foto */}
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center" data-test="foto-preview-container">
                  {imagemPreview ? (
                    <img 
                      src={imagemPreview.startsWith('data:') ? imagemPreview : `${imagemPreview}${imagemPreview.includes('?') ? '&' : '?'}t=${Date.now()}`} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                      data-test="foto-preview-image"
                    />
                  ) : (
                    <User className="w-20 h-20 text-gray-500" data-test="foto-preview-placeholder" />
                  )}
                </div>
              </div>

              {/* Upload de nova foto */}
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                  data-test="foto-upload-area"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-center text-sm">
                    <span className="font-semibold text-blue-600">Selecione uma nova foto</span>{' '}
                    <span className="text-gray-600">ou arraste aqui</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG ou JPEG até 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                  data-test="foto-file-input"
                />
              </div>
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelarEdicaoFoto}
                  disabled={uploadFotoMutation.isPending || deleteFotoMutation.isPending}
                  className="flex-1 cursor-pointer"
                  data-test="cancel-edit-foto-button"
                >
                  Cancelar
                </Button>
                {imagemPreview && !novaFoto && (
                  <Button
                    onClick={handleRemoverFoto}
                    disabled={deleteFotoMutation.isPending}
                    className="flex-1 text-white hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: '#DC2626' }}
                    data-test="remove-foto-button"
                  >
                    {deleteFotoMutation.isPending ? 'Removendo...' : 'Remover foto'}
                  </Button>
                )}
                {novaFoto && (
                  <Button
                    onClick={handleSalvarFoto}
                    disabled={uploadFotoMutation.isPending}
                    className="flex-1 text-white hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: '#306FCC' }}
                    data-test="save-foto-button"
                  >
                    {uploadFotoMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Foto */}
      {isConfirmRemoveOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => setIsConfirmRemoveOpen(false)}
          data-test="modal-confirm-remove-foto"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            {/* Botão de fechar */}
            <div className="relative p-6 pb-0">
              <button
                onClick={() => setIsConfirmRemoveOpen(false)}
                disabled={deleteFotoMutation.isPending}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Fechar"
                data-test="modal-confirm-remove-foto-close-button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center pt-4 px-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Remover foto de perfil
                </h2>
                <div className="max-h-[120px] overflow-y-auto">
                  <p className="text-gray-600 break-words">
                    Tem certeza que deseja remover sua foto de perfil? Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              {/* Mensagem de erro da API */}
              {deleteFotoMutation.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600" data-test="remove-foto-error-message">
                  <div className="font-medium mb-1">Não foi possível remover a foto</div>
                  <div className="text-red-500">
                    {(deleteFotoMutation.error as any)?.response?.data?.message ||
                      (deleteFotoMutation.error as any)?.message ||
                      'Erro desconhecido'}
                  </div>
                </div>
              )}
            </div>

            {/* Footer com ações */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmRemoveOpen(false)}
                  disabled={deleteFotoMutation.isPending}
                  className="flex-1 cursor-pointer"
                  data-test="cancel-remove-foto-button"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmRemoverFoto}
                  disabled={deleteFotoMutation.isPending}
                  className="flex-1 text-white hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: '#DC2626' }}
                  data-test="confirm-remove-foto-button"
                >
                  {deleteFotoMutation.isPending ? 'Removendo...' : 'Remover'}
                </Button>
              </div>
            </div>
          </div>
        </div>
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