'use client';

import { useQueryClient } from '@tanstack/react-query';
import ModalEmprestarUnidade from '@/components/modal-emprestar-unidade';
import ModalEditarPatrimonio from '@/components/modal-editar-patrimonio';
import ModalPatrimonioStatus from '@/components/modal-patrimonio-status';
import ModalPatrimonioTransferir from '@/components/modal-patrimonio-transferir';
import ModalPatrimonioRemover from '@/components/modal-patrimonio-remover';
import SheetDetalhePatrimonio from '@/components/sheet-detalhe-patrimonio';
import type { AcaoPatrimonioContexto } from '@/hooks/use-acoes-patrimonio';

interface PatrimonioAcoesModaisProps {
  contexto: AcaoPatrimonioContexto | null;
  onFechar: () => void;
}

// Bundle dos modais de ação de uma unidade patrimonial (Emprestar/Editar/
// Detalhe/Manutenção/Transferir/Baixar/Reativar/Remover). Cada card da
// grade só fornece o `contexto` da ação em curso.
export default function PatrimonioAcoesModais({
  contexto,
  onFechar,
}: PatrimonioAcoesModaisProps) {
  const queryClient = useQueryClient();

  return (
    <>
      {contexto?.tipo === 'emprestar' && (
        <ModalEmprestarUnidade
          isOpen
          onClose={onFechar}
          patrimonio={contexto.unidade}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['patrimonios'] });
          }}
        />
      )}

      {contexto?.tipo === 'editar' && (
        <ModalEditarPatrimonio
          isOpen
          onClose={onFechar}
          patrimonio={contexto.unidade}
        />
      )}

      <SheetDetalhePatrimonio
        open={contexto?.tipo === 'historico'}
        onOpenChange={(o) => {
          if (!o) onFechar();
        }}
        patrimonio={contexto?.tipo === 'historico' ? contexto.unidade : null}
      />

      {contexto?.tipo === 'manutencao' && (
        <ModalPatrimonioStatus
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
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
        />
      )}

      {contexto?.tipo === 'remover' && (
        <ModalPatrimonioRemover
          isOpen
          onClose={onFechar}
          patrimonioId={contexto.unidade._id}
          numeroPatrimonio={contexto.unidade.numero_patrimonio}
        />
      )}
    </>
  );
}
