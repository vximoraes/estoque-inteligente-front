import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';

interface Localizacao {
  _id: string;
  nome: string;
}

interface LocalizacoesApiResponse {
  data: {
    docs: Localizacao[];
    hasNextPage: boolean;
    nextPage: number | null;
  };
}

interface EstoqueData {
  localizacao: {
    _id: string;
    nome: string;
  };
  quantidade: number;
}

interface EstoqueApiResponse {
  data: {
    docs: EstoqueData[];
  };
}

interface EmprestimoRequest {
  item: string;
  localizacao: string;
  quantidade_emprestada: number;
  solicitante_nome: string;
  solicitante_email?: string;
  data_saida?: string;
  data_prevista_devolucao?: string;
  observacoes_emprestimo?: string;
}

interface ModalEmprestarItemProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  onSuccess?: () => void;
}

export default function ModalEmprestarItem({
  isOpen,
  onClose,
  itemId,
  itemNome,
  onSuccess,
}: ModalEmprestarItemProps) {
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);

  const [quantidade, setQuantidade] = useState('');
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [dataEmprestimo, setDataEmprestimo] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localizacaoPesquisa, setLocalizacaoPesquisa] = useState('');
  const [errors, setErrors] = useState<{
    quantidade?: string;
    solicitanteNome?: string;
    solicitanteEmail?: string;
    dataEmprestimo?: string;
    dataPrevista?: string;
    localizacao?: string;
  }>({});

  const {
    data: localizacoesData,
    isLoading: isLoadingLocalizacoes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['localizacoes-infinite', 'emprestimo'],
    queryFn: async ({ pageParam = 1 }) => {
      return await get<LocalizacoesApiResponse>(
        `/localizacoes?limite=20&page=${pageParam}`,
      );
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen,
  });

  const { data: estoquesData } = useQuery<EstoqueApiResponse>({
    queryKey: ['estoques', itemId, 'emprestimo'],
    queryFn: async () => {
      return await get<EstoqueApiResponse>(`/estoques/item/${itemId}`);
    },
    enabled: isOpen && !!itemId,
  });

  const emprestimoMutation = useMutation({
    mutationFn: async (payload: EmprestimoRequest) => {
      return await post('/emprestimos', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens'] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.removeQueries({ queryKey: ['estoques', itemId] });

      toast.success('Empréstimo registrado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const mensagem =
        error?.errors?.[0]?.message ||
        error?.message ||
        'Não foi possível registrar o empréstimo.';
      toast.error(mensagem, {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
  });

  const localizacoes = useMemo(() => {
    return localizacoesData?.pages
      ? localizacoesData.pages.flatMap((page) => page.data.docs)
      : [];
  }, [localizacoesData]);

  const estoques = estoquesData?.data?.docs || [];

  const localizacoesComEstoque = useMemo(() => {
    return localizacoes.filter((loc) => {
      const estoque = estoques.find((e) => e.localizacao._id === loc._id);
      return (estoque?.quantidade || 0) > 0;
    });
  }, [localizacoes, estoques]);

  const localizacoesFiltradas = useMemo(() => {
    return localizacoesComEstoque.filter((loc) =>
      loc.nome.toLowerCase().includes(localizacaoPesquisa.toLowerCase()),
    );
  }, [localizacoesComEstoque, localizacaoPesquisa]);

  const localizacaoSelecionadaObj = localizacoesComEstoque.find(
    (loc) => loc._id === localizacaoSelecionada,
  );

  const quantidadeDisponivel = localizacaoSelecionada
    ? (estoques.find((e) => e.localizacao._id === localizacaoSelecionada)
        ?.quantidade ?? 0)
    : 0;

  useEffect(() => {
    if (!observerTarget.current || !isDropdownOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isDropdownOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setQuantidade('');
    setSolicitanteNome('');
    setSolicitanteEmail('');
    setDataEmprestimo('');
    setDataPrevista('');
    setObservacoes('');
    setLocalizacaoSelecionada('');
    setIsDropdownOpen(false);
    setLocalizacaoPesquisa('');
    setErrors({});
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: {
      quantidade?: string;
      solicitanteNome?: string;
      solicitanteEmail?: string;
      dataEmprestimo?: string;
      dataPrevista?: string;
      localizacao?: string;
    } = {};

    if (!localizacaoSelecionada) {
      newErrors.localizacao = 'Selecionar localização';
    }

    const quantidadeNumber = Number(quantidade);
    if (
      !quantidade ||
      !Number.isInteger(quantidadeNumber) ||
      quantidadeNumber <= 0
    ) {
      newErrors.quantidade = 'Quantidade deve ser maior que 0';
    } else if (
      localizacaoSelecionada &&
      quantidadeNumber > quantidadeDisponivel
    ) {
      newErrors.quantidade = `Quantidade maior que o disponível (${quantidadeDisponivel})`;
    }

    if (!solicitanteNome || solicitanteNome.trim().length < 3) {
      newErrors.solicitanteNome = 'Informe o solicitante (mín. 3 caracteres)';
    }

    if (solicitanteEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(solicitanteEmail.trim())) {
        newErrors.solicitanteEmail = 'E-mail inválido';
      }
    }

    if (dataEmprestimo) {
      const data = new Date(dataEmprestimo);
      if (Number.isNaN(data.getTime()) || data > new Date()) {
        newErrors.dataEmprestimo = 'A data do empréstimo não pode ser futura';
      }
    }

    if (dataPrevista) {
      const data = new Date(dataPrevista);
      if (Number.isNaN(data.getTime()) || data <= new Date()) {
        newErrors.dataPrevista = 'A data prevista deve ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    emprestimoMutation.mutate({
      item: itemId,
      localizacao: localizacaoSelecionada,
      quantidade_emprestada: Number(quantidade),
      solicitante_nome: solicitanteNome.trim(),
      solicitante_email: solicitanteEmail.trim() || undefined,
      data_saida: dataEmprestimo
        ? new Date(dataEmprestimo).toISOString()
        : undefined,
      data_prevista_devolucao: dataPrevista
        ? new Date(dataPrevista).toISOString()
        : undefined,
      observacoes_emprestimo: observacoes.trim() || undefined,
    });
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="z-50"
      data-test="modal-emprestar-item"
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
          data-test="close-modal-button"
        >
          <X size={20} className="text-muted-foreground" />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Emprestar Item
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Item
          </label>
          <div className="w-full h-11 flex items-center px-3 border border-border rounded-md bg-muted/50 text-muted-foreground">
            {itemNome}
          </div>
        </div>

        <div className="relative" data-dropdown>
          <label className="block text-base font-medium text-foreground mb-1">
            Localização <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-11 flex items-center justify-between px-3 border border-border rounded-md text-left hover:border-[var(--ei-accent)]/40 transition-colors cursor-pointer"
          >
            <span
              className={
                localizacaoSelecionadaObj
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }
            >
              {localizacaoSelecionadaObj
                ? `${localizacaoSelecionadaObj.nome} (${quantidadeDisponivel} disponíveis)`
                : 'Selecionar localização'}
            </span>
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md z-50 max-h-60 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border bg-muted/50">
                <input
                  type="text"
                  value={localizacaoPesquisa}
                  onChange={(e) => setLocalizacaoPesquisa(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="overflow-y-auto">
                {isLoadingLocalizacoes ? (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Carregando...
                  </div>
                ) : localizacoesFiltradas.length > 0 ? (
                  <>
                    {localizacoesFiltradas.map((loc) => {
                      const estoque =
                        estoques.find((e) => e.localizacao._id === loc._id)
                          ?.quantidade || 0;
                      return (
                        <button
                          key={loc._id}
                          type="button"
                          className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                            localizacaoSelecionada === loc._id
                              ? 'bg-[var(--ei-accent)]/5 text-[var(--ei-accent)] font-medium'
                              : 'text-foreground'
                          }`}
                          onClick={() => {
                            setLocalizacaoSelecionada(loc._id);
                            setIsDropdownOpen(false);
                            setLocalizacaoPesquisa('');
                            setErrors((prev) => ({
                              ...prev,
                              localizacao: undefined,
                            }));
                          }}
                        >
                          <span className="truncate">{loc.nome}</span>
                          <span className="text-sm px-2 py-0.5 rounded-md shrink-0 bg-muted/50 text-muted-foreground">
                            {estoque} disponível
                          </span>
                        </button>
                      );
                    })}
                    <div ref={observerTarget} className="h-2" />
                  </>
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Nenhuma localização com estoque.
                  </div>
                )}
              </div>
            </div>
          )}
          {errors.localizacao && (
            <p className="mt-1 text-sm text-destructive">
              {errors.localizacao}
            </p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Quantidade <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => {
              setQuantidade(e.target.value);
              setErrors((prev) => ({ ...prev, quantidade: undefined }));
            }}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="Digite a quantidade"
          />
          {errors.quantidade && (
            <p className="mt-1 text-sm text-destructive">{errors.quantidade}</p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Solicitante <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={solicitanteNome}
            onChange={(e) => {
              setSolicitanteNome(e.target.value);
              setErrors((prev) => ({ ...prev, solicitanteNome: undefined }));
            }}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="Nome da pessoa solicitante"
          />
          {errors.solicitanteNome && (
            <p className="mt-1 text-sm text-destructive">
              {errors.solicitanteNome}
            </p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            E-mail do solicitante
          </label>
          <input
            type="email"
            value={solicitanteEmail}
            onChange={(e) => {
              setSolicitanteEmail(e.target.value);
              setErrors((prev) => ({ ...prev, solicitanteEmail: undefined }));
            }}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="E-mail da pessoa solicitante (opcional)"
          />
          {errors.solicitanteEmail && (
            <p className="mt-1 text-sm text-destructive">
              {errors.solicitanteEmail}
            </p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Data do empréstimo
          </label>
          <input
            type="datetime-local"
            value={dataEmprestimo}
            onChange={(e) => {
              setDataEmprestimo(e.target.value);
              setErrors((prev) => ({ ...prev, dataEmprestimo: undefined }));
            }}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Deixe em branco para usar o momento atual. Use para registrar um
            empréstimo feito no passado.
          </p>
          {errors.dataEmprestimo && (
            <p className="mt-1 text-sm text-destructive">
              {errors.dataEmprestimo}
            </p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Data prevista de devolução
          </label>
          <input
            type="datetime-local"
            value={dataPrevista}
            onChange={(e) => {
              setDataPrevista(e.target.value);
              setErrors((prev) => ({ ...prev, dataPrevista: undefined }));
            }}
            className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
          />
          {errors.dataPrevista && (
            <p className="mt-1 text-sm text-destructive">
              {errors.dataPrevista}
            </p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-foreground mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-3 py-2 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            rows={3}
            placeholder="Observações opcionais"
            maxLength={500}
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 flex-1 cursor-pointer"
            disabled={emprestimoMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-11 flex-1 text-ei-accent-foreground cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            disabled={emprestimoMutation.isPending}
          >
            {emprestimoMutation.isPending
              ? 'Registrando...'
              : 'Confirmar Empréstimo'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return createPortal(modalContent, document.body);
}
