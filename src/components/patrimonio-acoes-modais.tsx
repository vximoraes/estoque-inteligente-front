'use client';

import { useQueryClient } from '@tanstack/react-query';
import ModalEmprestarUnidade from '@/components/modal-emprestar-unidade';
import ModalPatrimonioStatus from '@/components/modal-patrimonio-status';
import ModalPatrimonioTransferir from '@/components/modal-patrimonio-transferir';
import ModalPatrimonioRemover from '@/components/modal-patrimonio-remover';
import SheetHistoricoPatrimonio from '@/components/sheet-historico-patrimonio';
import type { AcaoPatrimonioContexto } from '@/hooks/use-acoes-patrimonio';

interface PatrimonioAcoesModaisProps {
  contexto: AcaoPatrimonioContexto | null;
  onFechar: () => void;
  /** "Voltar às unidades" a partir do histórico. Só o drawer precisa
   * reabrir o Sheet pai; a página global apenas fecha o histórico. */
  onVoltarHistorico?: () => void;
}

// Bundle dos modais de ação de uma unidade patrimonial (Emprestar/
// Histórico/Manutenção/Transferir/Baixar/Reativar/Remover). Compartilhado
// entre o drawer (`sheet-unidades-item.tsx`) e a página global de
// unidades — cada um só fornece o `contexto` da ação em curso.
export default function PatrimonioAcoesModais({
  contexto,
  onFechar,
  onVoltarHistorico,
}: PatrimonioAcoesModaisProps) {
  const queryClient = useQueryClient();

  return (
    <>
      {contexto?.tipo === 'emprestar' && (
        <ModalEmprestarUnidade
          isOpen
          onClose={onFechar}
          itemId={contexto.itemId}
          itemNome={contexto.itemNome}
          patrimonioPreSelecionado={contexto.unidade._id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
            queryClient.invalidateQueries({
              queryKey: ['item-detalhe', contexto.itemId],
            });
          }}
        />
      )}

      <SheetHistoricoPatrimonio
        open={contexto?.tipo === 'historico'}
        onOpenChange={(o) => {
          if (!o) onFechar();
        }}
        patrimonioId={
          contexto?.tipo === 'historico' ? contexto.unidade._id : null
        }
        numeroPatrimonio={contexto?.unidade.numero_patrimonio}
        onVoltar={onVoltarHistorico ?? onFechar}
      />

      {contexto?.tipo === 'manutencao' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
          itemId={contexto.itemId}
          novoStatus="Manutenção"
          titulo="Enviar para manutenção"
          descricao="A unidade fica indisponível para empréstimo até retornar."
          confirmLabel="Confirmar envio"
        />
      )}

      {contexto?.tipo === 'retornarManutencao' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
          itemId={contexto.itemId}
          novoStatus="Disponível"
          titulo="Retornar da manutenção"
          descricao="A unidade volta a ficar disponível para empréstimo."
          confirmLabel="Confirmar retorno"
        />
      )}

      {contexto?.tipo === 'baixar' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
          itemId={contexto.itemId}
          novoStatus="Baixado"
          titulo="Baixar unidade"
          descricao="Sai do estoque ativo e fica registrada no histórico."
          confirmLabel="Confirmar baixa"
          destrutivo
        />
      )}

      {contexto?.tipo === 'reativar' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
          itemId={contexto.itemId}
          novoStatus="Disponível"
          titulo="Reativar unidade"
          descricao="A unidade volta a ficar disponível para uso."
          confirmLabel="Reativar"
        />
      )}

      {contexto?.tipo === 'transferir' && (
        <ModalPatrimonioTransferir
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
          localizacaoAtualId={contexto.unidade.localizacao._id}
          itemId={contexto.itemId}
        />
      )}

      {contexto?.tipo === 'remover' && (
        <ModalPatrimonioRemover
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
          itemId={contexto.itemId}
        />
      )}
    </>
  );
}
