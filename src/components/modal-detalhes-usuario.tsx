'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check } from 'lucide-react';
import { get } from '@/lib/fetchData';
import { ModalShell } from '@/components/ui/modal-shell';

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  ativo: boolean;
  convidadoEm?: string;
  ativadoEm?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UsuarioApiResponse {
  data: Usuario;
}

interface ModalDetalhesUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string;
}

const STATUS_BG: Record<'ativo' | 'aguardando', string> = {
  ativo: 'var(--status-success-bg)',
  aguardando: 'var(--status-warning-bg)',
};

const STATUS_TEXT: Record<'ativo' | 'aguardando', string> = {
  ativo: 'var(--status-success-text)',
  aguardando: 'var(--status-warning-text)',
};

export default function ModalDetalhesUsuario({
  isOpen,
  onClose,
  usuarioId,
}: ModalDetalhesUsuarioProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && usuarioId) {
      loadUsuario();
    }
  }, [isOpen, usuarioId]);

  const loadUsuario = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await get<UsuarioApiResponse>(`/usuarios/${usuarioId}`);
      setUsuario(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar usuário:', err);
      setError(
        err?.response?.data?.message || 'Erro ao carregar dados do usuário',
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleClose = () => {
    setUsuario(null);
    setError(null);
    setCopiedField(null);
    onClose();
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      data-test="modal-detalhes-usuario"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-border flex-shrink-0">
        <button
          data-test="modal-detalhes-close"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer z-10"
          title="Fechar"
        >
          <X size={20} />
        </button>
        <div className="text-center px-8">
          <div className="max-h-[100px] overflow-y-auto">
            <h2 className="text-xl font-semibold text-foreground break-words">
              {usuario?.nome || 'Detalhes do Usuário'}
            </h2>
          </div>
          {usuario && (
            <div className="flex justify-center mt-2">
              <span
                data-test="modal-detalhes-status"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-current/30 text-xs font-medium whitespace-nowrap"
                style={{
                  color: STATUS_TEXT[usuario.ativo ? 'ativo' : 'aguardando'],
                  backgroundColor:
                    STATUS_BG[usuario.ativo ? 'ativo' : 'aguardando'],
                }}
              >
                {usuario.ativo ? 'Ativo' : 'Aguardando ativação'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Mensagem de erro */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            <div className="font-medium mb-1">
              Não foi possível carregar o usuário
            </div>
            <div className="text-destructive/80">{error}</div>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
            </div>
          </div>
        ) : usuario ? (
          <div className="space-y-4 text-left">
            {/* E-mail com botão de copiar */}
            <div>
              <label className="text-lg font-semibold text-foreground block mb-2">
                E-mail
              </label>
              <div className="flex items-center gap-2">
                <p
                  data-test="modal-detalhes-email"
                  className="text-base text-foreground truncate flex-1"
                  title={usuario.email}
                >
                  {usuario.email}
                </p>
                <button
                  data-test="modal-detalhes-copiar-email"
                  onClick={() => handleCopy(usuario.email, 'email')}
                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors flex-shrink-0 cursor-pointer"
                  title="Copiar e-mail"
                >
                  {copiedField === 'email' ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Datas */}
            <div className="pt-4 grid grid-cols-2 gap-4">
              {usuario.convidadoEm && (
                <div>
                  <label className="text-base font-medium text-muted-foreground block mb-2">
                    Convidado em
                  </label>
                  <p className="text-base text-muted-foreground">
                    {new Date(usuario.convidadoEm).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {usuario.ativadoEm && (
                <div>
                  <label className="text-base font-medium text-muted-foreground block mb-2">
                    Ativado em
                  </label>
                  <p className="text-base text-muted-foreground">
                    {new Date(usuario.ativadoEm).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {usuario.createdAt && (
                <div>
                  <label className="text-base font-medium text-muted-foreground block mb-2">
                    Criado em
                  </label>
                  <p className="text-base text-muted-foreground">
                    {new Date(usuario.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {usuario.updatedAt && (
                <div>
                  <label className="text-base font-medium text-muted-foreground block mb-2">
                    Atualizado em
                  </label>
                  <p className="text-base text-muted-foreground">
                    {new Date(usuario.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
