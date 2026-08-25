'use client';

// Drawer das unidades patrimoniais de um item permanente: lista, busca,
// filtro por status, e as ações por unidade (Emprestar/Ver histórico/
// Manutenção/Transferir/Baixar), cada uma delegando pra um modal próprio.

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Plus, Search } from 'lucide-react';
import ModalPatrimonioAdicionarUnidades from '@/components/modal-patrimonio-adicionar-unidades';
import PatrimonioLinhaAcoes from '@/components/patrimonio-linha-acoes';
import PatrimonioAcoesModais from '@/components/patrimonio-acoes-modais';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/status-badge';
import { get } from '@/lib/fetchData';
import type { ItemPermanenteData } from '@/types/itens';
import {
  PATRIMONIO_STATUS_OPTIONS,
  type AcaoPatrimonio,
  type PatrimonioApiResponse,
  type PatrimonioData,
  type PatrimonioStatus,
} from '@/types/patrimonios';
import { useAcoesPatrimonio } from '@/hooks/use-acoes-patrimonio';

interface SheetUnidadesItemProps {
  itemId: string | null;
  itemNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SheetUnidadesItem({
  itemId,
  itemNome,
  open,
  onOpenChange,
}: SheetUnidadesItemProps) {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<PatrimonioStatus | null>(
    null,
  );
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
  const { data: itemData } = useQuery<{ data: ItemPermanenteData }>({
    queryKey: ['item-detalhe', itemIdEfetivo],
    queryFn: () => get<{ data: ItemPermanenteData }>(`/itens/${itemIdEfetivo}`),
    enabled: !!itemIdEfetivo && open,
  });

  // Limite alto (o máximo aceito pela API, PatrimonioQuerySchema.limite<=100)
  // em vez de paginação real: o volume esperado é dezenas de unidades por
  // item, não milhares. Se isso deixar de ser verdade, trocar por
  // paginação de verdade na tabela.
  const { data: patrimoniosData, isLoading } = useQuery<PatrimonioApiResponse>({
    queryKey: ['patrimonios', itemIdEfetivo],
    queryFn: () =>
      get<PatrimonioApiResponse>(
        `/patrimonios?item=${itemIdEfetivo}&limite=100`,
      ),
    enabled: !!itemIdEfetivo && open,
  });

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
  const {
    contexto: acaoContexto,
    abrir: abrirAcaoRaw,
    fechar: fecharAcao,
  } = useAcoesPatrimonio(() => onOpenChange(false));

  const abrirAcao = (tipo: AcaoPatrimonio, unidade: PatrimonioData) => {
    if (!itemIdEfetivo) return;
    abrirAcaoRaw(tipo, unidade, itemIdEfetivo, nomeExibido);
  };

  // "Voltar às unidades" a partir do histórico: reabre este Sheet (sem
  // depender da prop `itemId`, que o pai já zerou — ver `itemIdEfetivo`)
  // em vez de fechar tudo e deixar o usuário na grade.
  const voltarParaUnidades = () => {
    fecharAcao();
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por número de patrimônio ou localização..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-11 pl-11 pr-3"
                data-test="sheet-unidades-busca"
              />
            </div>
            <Button
              type="button"
              onClick={() => setModalAdicionarAberto(true)}
              className="text-ei-accent-foreground h-11! w-11! p-0! flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
              style={{ backgroundColor: 'var(--ei-accent)' }}
              title="Adicionar unidades"
              data-test="sheet-unidades-adicionar"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div
            className="grid grid-cols-4 gap-2"
            data-test="sheet-unidades-chips"
          >
            {PATRIMONIO_STATUS_OPTIONS.map((opcao) => {
              const ativo = statusFiltro === opcao;
              return (
                <button
                  key={opcao}
                  onClick={() => setStatusFiltro(ativo ? null : opcao)}
                  className={`h-[28px] px-2.5 flex items-center justify-center rounded-md text-xs border font-medium transition-colors cursor-pointer ${
                    ativo
                      ? 'border-[var(--ei-accent)] bg-[var(--ei-accent)]/15 text-[var(--ei-accent)]'
                      : 'bg-muted border-border text-foreground hover:bg-muted/70'
                  }`}
                  data-test={`sheet-unidades-chip-${opcao}`}
                >
                  {opcao}
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
                    <TableHead className="text-center">Status</TableHead>
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
                      <TableCell className="text-center">
                        <StatusBadge status={unidade.status} size="sm" />
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PatrimonioLinhaAcoes
                          unidade={unidade}
                          onAcao={abrirAcao}
                          data-test="sheet-unidades-acoes-trigger"
                        />
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

      <PatrimonioAcoesModais
        contexto={acaoContexto}
        onFechar={fecharAcao}
        onVoltarHistorico={voltarParaUnidades}
      />

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
