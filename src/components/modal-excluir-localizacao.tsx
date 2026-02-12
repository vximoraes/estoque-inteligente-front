"use client"

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patch } from '@/lib/fetchData'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'

interface ModalExcluirLocalizacaoProps {
  isOpen: boolean
  onClose: () => void
  localizacaoId: string
  localizacaoNome: string
  onSuccess?: () => void
}

export default function ModalExcluirLocalizacao({
  isOpen,
  onClose,
  localizacaoId,
  localizacaoNome,
  onSuccess
}: ModalExcluirLocalizacaoProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const inativarLocalizacaoMutation = useMutation({
    mutationFn: async () => {
      return await patch(`/localizacoes/${localizacaoId}/inativar`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizacoes'] })
      queryClient.invalidateQueries({ queryKey: ['localizacoes-infinite'] })
      toast.success('Localização excluída com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      onClose()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao excluir localização'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    },
  })

  const handleClose = () => {
    if (!inativarLocalizacaoMutation.isPending) {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleConfirm = () => {
    inativarLocalizacaoMutation.mutate()
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleClose}
            disabled={inativarLocalizacaoMutation.isPending}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Excluir localização
            </h2>
            <p className="text-gray-600">
              Tem certeza que deseja excluir a localização{' '}
              <span className="font-semibold truncate inline-block max-w-[300px] align-bottom" title={localizacaoNome}>
                {localizacaoNome}
              </span>
              ?
            </p>
          </div>

          {inativarLocalizacaoMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <div className="font-medium mb-1">Erro ao excluir localização</div>
              <div className="text-red-500">
                {(inativarLocalizacaoMutation.error as any)?.response?.data?.message ||
                  (inativarLocalizacaoMutation.error as any)?.message ||
                  'Erro desconhecido'}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inativarLocalizacaoMutation.isPending}
              className="flex-1 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={inativarLocalizacaoMutation.isPending}
              className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              {inativarLocalizacaoMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

