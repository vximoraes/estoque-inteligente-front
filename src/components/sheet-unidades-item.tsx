'use client';

// Drawer das unidades patrimoniais de um item permanente: lista, busca,
// filtro por status, e as ações por unidade (Emprestar/Ver histórico/
// Manutenção/Transferir/Baixar), cada uma delegando pra um modal próprio.

import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import ModalEmprestarUnidade from '@/components/modal-emprestar-unidade';
import ModalPatrimonioStatus from '@/components/modal-patrimonio-status';
import ModalPatrimonioTransferir from '@/components/modal-patrimonio-transferir';
import ModalPatrimonioRemover from '@/components/modal-patrimonio-remover';
import ModalPatrimonioAdicionarUnidades from '@/components/modal-patrimonio-adicionar-unidades';
import SheetHistoricoPatrimonio from '@/components/sheet-historico-patrimonio';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/status-badge';
import { get } from '@/lib/fetchData';
import type { ItemEstoqueData } from '@/types/itens';
import type {
  PatrimonioApiResponse,
  PatrimonioData,
  PatrimonioStatus,
} from '@/types/patrimonios';

interface SheetUnidadesItemProps {
  itemId: string | null;
  itemNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: PatrimonioStatus[] = [
  'Disponível',
  'Emprestado',
  'Manutenção',
  'Baixado',
];

type AcaoTipo =
  | 'emprestar'
  | 'historico'
  | 'manutencao'
  | 'retornarManutencao'
  | 'baixar'
  | 'reativar'
  | 'transferir'
  | 'remover';

export default function SheetUnidadesItem({
  itemId,
  itemNome,
  open,
  onOpenChange,
}: SheetUnidadesItemProps) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<PatrimonioStatus | null>(
    null,
  );
  // Snapshot próprio da ação em curso (tipo + unidade + item/nome),
  // independente da prop `itemId`: fechar o Sheet (necessário para não
  // competir por foco com o modal — ver comentário em `abrirAcao`) dispara
  // no pai um `setTimeout` que zera `itemId` depois de 300ms; se o modal
  // dependesse direto da prop, ele se desmontaria sozinho nesse meio-tempo,
  // antes do usuário terminar a ação.
  const [acaoContexto, setAcaoContexto] = useState<{
    tipo: AcaoTipo;
    unidade: PatrimonioData;
    itemId: string;
    itemNome: string;
  } | null>(null);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);

  // O pai zera a prop `itemId` 300ms depois de fechar o Sheet (ver
  // `abrirAcao`), o que quebraria "Voltar às unidades" vindo do histórico
  // se essas queries dependessem dela direto. Guarda o último id não-nulo
  // aqui: sobrevive ao fechamento e só troca quando um item novo abre.
  const itemIdRef = useRef<string | null>(null);
  if (itemId) itemIdRef.current = itemId;
  const itemIdEfetivo = itemId ?? itemIdRef.current;

  // Contadores do header vêm do Item, não somados no client: é o valor
  // autoritativo já mantido pela cascata do backend (Patrimonio →
  // atualizarContadoresItem → Item.quantidade/quantidade_disponivel).
  const { data: itemData } = useQuery<{ data: ItemEstoqueData }>({
    queryKey: ['item-detalhe', itemIdEfetivo],
    queryFn: () => get<{ data: ItemEstoqueData }>(`/itens/${itemIdEfetivo}`),
    enabled: !!itemIdEfetivo && open,
  });

  // Limite alto (o máximo aceito pela API, PatrimonioQuerySchema.limite<=100)
  // em vez de paginação real: o volume esperado é dezenas de unidades por
  // item, não milhares. Se isso deixar de ser verdade, trocar por
  // paginação de verdade na tabela.
  const { data: patrimoniosData, isLoading } = useQuery<PatrimonioApiResponse>(
    {
      queryKey: ['patrimonios', itemIdEfetivo],
      queryFn: () =>
        get<PatrimonioApiResponse>(
          `/patrimonios?item=${itemIdEfetivo}&limite=100`,
        ),
      enabled: !!itemIdEfetivo && open,
    },
  );

  const unidades = patrimoniosData?.data?.docs ?? [];

  const unidadesFiltradas = useMemo(() => {
    return unidades.filter((unidade) => {
      if (statusFiltro && unidade.status !== statusFiltro) return false;
      const termo = busca.trim().toLowerCase();
      if (
        termo &&
        !unidade.numero_patrimonio.toLowerCase().includes(termo) &&
        !(unidade.localizacao?.nome ?? '').toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `patrimoniosData` é a dependência real e estável por conteúdo (React Query só entrega nova referência quando o resultado muda de fato); `unidades` é derivado dele a cada render e mudaria a comparação para sempre-diferente.
  }, [patrimoniosData, statusFiltro, busca]);

  const item = itemData?.data;
  const nomeExibido = itemNome ?? item?.nome ?? '';

  // Os modais de ação (Emprestar/Manutenção/Transferir/Baixar) são Radix
  // Dialog (`ui/dialog.tsx`), não `createPortal` avulso — aninhado dentro
  // de outro Radix Dialog (este Sheet) não rouba foco, então ficam abertos
  // por cima do drawer sem fechá-lo. Histórico é diferente: é outro Sheet
  // (drill-down, troca de tela), por isso fecha este antes de abrir.
  const abrirAcao = (tipo: AcaoTipo, unidade: PatrimonioData) => {
    if (!itemIdEfetivo) return;
    setAcaoContexto({
      tipo,
      unidade,
      itemId: itemIdEfetivo,
      itemNome: nomeExibido,
    });
    if (tipo === 'historico') onOpenChange(false);
  };

  const fecharAcao = () => setAcaoContexto(null);

  // "Voltar às unidades" a partir do histórico: reabre este Sheet (sem
  // depender da prop `itemId`, que o pai já zerou — ver `itemIdEfetivo`)
  // em vez de fechar tudo e deixar o usuário na grade.
  const voltarParaUnidades = () => {
    setAcaoContexto(null);
    onOpenChange(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg"
        data-test="sheet-unidades-item"
      >
        <SheetHeader className="pb-2">
          <SheetTitle data-test="sheet-unidades-titulo">
            {nomeExibido}
          </SheetTitle>
          <SheetDescription data-test="sheet-unidades-contadores">
            {item
              ? `${item.quantidade} unidade${item.quantidade === 1 ? '' : 's'} · ${
                  item.quantidade_disponivel
                } disponíve${item.quantidade_disponivel === 1 ? 'l' : 'is'}`
              : 'Carregando…'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pt-1 flex-1 overflow-hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por número de patrimônio ou localização..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-9 pl-9 pr-3"
                data-test="sheet-unidades-busca"
              />
            </div>
            <button
              onClick={() => setModalAdicionarAberto(true)}
              className="h-9 w-9 flex items-center justify-center bg-card dark:bg-input/30 border border-input rounded-md hover:bg-muted/40 transition-colors cursor-pointer shrink-0"
              title="Adicionar unidades"
              data-test="sheet-unidades-adicionar"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2" data-test="sheet-unidades-chips">
            {STATUS_OPTIONS.map((opcao) => {
              const ativo = statusFiltro === opcao;
              return (
                <button
                  key={opcao}
                  onClick={() => setStatusFiltro(ativo ? null : opcao)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border font-medium transition-colors cursor-pointer ${
                    ativo
                      ? 'bg-muted text-foreground border-border'
                      : 'text-muted-foreground border-border/60 hover:bg-muted/40'
                  }`}
                  data-test={`sheet-unidades-chip-${opcao}`}
                >
                  {opcao}
                  {ativo && <X size={11} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Carregando unidades...
              </p>
            ) : unidadesFiltradas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma unidade encontrada.
              </p>
            ) : (
              <Table data-test="sheet-unidades-tabela">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Patrimônio</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unidadesFiltradas.map((unidade) => (
                    <TableRow
                      key={unidade._id}
                      onClick={() => abrirAcao('historico', unidade)}
                      className="h-12 cursor-pointer"
                      title={`Ver histórico de ${unidade.numero_patrimonio}`}
                      data-test={`sheet-unidades-linha-${unidade.numero_patrimonio}`}
                    >
                      <TableCell className="font-medium">
                        {unidade.numero_patrimonio}
                      </TableCell>
                      <TableCell>{unidade.localizacao?.nome ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={unidade.status} size="sm" />
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 rounded-md hover:bg-muted/60 cursor-pointer"
                              data-test="sheet-unidades-acoes-trigger"
                              aria-label="Ações da unidade"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => abrirAcao('emprestar', unidade)}
                              disabled={unidade.status !== 'Disponível'}
                            >
                              Emprestar
                            </DropdownMenuItem>
                            {unidade.status === 'Manutenção' ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  abrirAcao('retornarManutencao', unidade)
                                }
                              >
                                Retornar da manutenção
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => abrirAcao('manutencao', unidade)}
                                disabled={unidade.status !== 'Disponível'}
                              >
                                Manutenção
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => abrirAcao('transferir', unidade)}
                              disabled={unidade.status === 'Emprestado'}
                            >
                              Transferir
                            </DropdownMenuItem>
                            {unidade.status === 'Baixado' ? (
                              <DropdownMenuItem
                                onClick={() => abrirAcao('reativar', unidade)}
                              >
                                Reativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => abrirAcao('baixar', unidade)}
                                disabled={unidade.status === 'Emprestado'}
                                variant="destructive"
                              >
                                Baixar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => abrirAcao('remover', unidade)}
                              disabled={unidade.status === 'Emprestado'}
                              variant="destructive"
                            >
                              Remover (erro de cadastro)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ChevronRight size={16} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </SheetContent>

      {acaoContexto?.tipo === 'emprestar' && (
        <ModalEmprestarUnidade
          isOpen
          onClose={fecharAcao}
          itemId={acaoContexto.itemId}
          itemNome={acaoContexto.itemNome}
          patrimonioPreSelecionado={acaoContexto.unidade._id}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['patrimonios', acaoContexto.itemId],
            });
            queryClient.invalidateQueries({
              queryKey: ['item-detalhe', acaoContexto.itemId],
            });
          }}
        />
      )}

      <SheetHistoricoPatrimonio
        open={acaoContexto?.tipo === 'historico'}
        onOpenChange={(o) => {
          if (!o) fecharAcao();
        }}
        patrimonioId={
          acaoContexto?.tipo === 'historico' ? acaoContexto.unidade._id : null
        }
        numeroPatrimonio={acaoContexto?.unidade.numero_patrimonio}
        onVoltar={voltarParaUnidades}
      />

      {acaoContexto?.tipo === 'manutencao' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={fecharAcao}
          patrimonioId={acaoContexto.unidade._id}
          numeroPatrimonio={acaoContexto.unidade.numero_patrimonio}
          itemId={acaoContexto.itemId}
          novoStatus="Manutenção"
          titulo="Enviar para manutenção"
          descricao="A unidade fica indisponível para empréstimo até retornar."
          confirmLabel="Confirmar envio"
        />
      )}

      {acaoContexto?.tipo === 'retornarManutencao' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={fecharAcao}
          patrimonioId={acaoContexto.unidade._id}
          numeroPatrimonio={acaoContexto.unidade.numero_patrimonio}
          itemId={acaoContexto.itemId}
          novoStatus="Disponível"
          titulo="Retornar da manutenção"
          descricao="A unidade volta a ficar disponível para empréstimo."
          confirmLabel="Confirmar retorno"
        />
      )}

      {acaoContexto?.tipo === 'baixar' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={fecharAcao}
          patrimonioId={acaoContexto.unidade._id}
          numeroPatrimonio={acaoContexto.unidade.numero_patrimonio}
          itemId={acaoContexto.itemId}
          novoStatus="Baixado"
          titulo="Baixar unidade"
          descricao="Sai do estoque ativo e fica registrada no histórico."
          confirmLabel="Confirmar baixa"
          destrutivo
        />
      )}

      {acaoContexto?.tipo === 'reativar' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={fecharAcao}
          patrimonioId={acaoContexto.unidade._id}
          numeroPatrimonio={acaoContexto.unidade.numero_patrimonio}
          itemId={acaoContexto.itemId}
          novoStatus="Disponível"
          titulo="Reativar unidade"
          descricao="A unidade volta a ficar disponível para uso."
          confirmLabel="Reativar"
        />
      )}

      {acaoContexto?.tipo === 'transferir' && (
        <ModalPatrimonioTransferir
          isOpen
          onClose={fecharAcao}
          patrimonioId={acaoContexto.unidade._id}
          numeroPatrimonio={acaoContexto.unidade.numero_patrimonio}
          localizacaoAtualId={acaoContexto.unidade.localizacao._id}
          itemId={acaoContexto.itemId}
        />
      )}

      {acaoContexto?.tipo === 'remover' && (
        <ModalPatrimonioRemover
          isOpen
          onClose={fecharAcao}
          patrimonioId={acaoContexto.unidade._id}
          numeroPatrimonio={acaoContexto.unidade.numero_patrimonio}
          itemId={acaoContexto.itemId}
        />
      )}

      {itemIdEfetivo && (
        <ModalPatrimonioAdicionarUnidades
          isOpen={modalAdicionarAberto}
          onClose={() => setModalAdicionarAberto(false)}
          itemId={itemIdEfetivo}
          itemNome={nomeExibido}
          unidadesExistentes={unidades}
        />
      )}
    </Sheet>
  );
}
