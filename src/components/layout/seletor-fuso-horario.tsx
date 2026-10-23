'use client';

import { useMemo, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { deslocamentoDoFuso } from '@/lib/datas';
import { useFusoHorario } from '@/hooks/use-fuso-horario';

function nomeDoFuso(fuso: string) {
  return (fuso.split('/').pop() ?? fuso).replace(/_/g, ' ');
}

interface SeletorFusoHorarioProps {
  collapsed?: boolean;
  dataTest: string;
}

export default function SeletorFusoHorario({
  collapsed = false,
  dataTest,
}: SeletorFusoHorarioProps) {
  const { fuso, fusoSalvo, salvar, salvando, erro } = useFusoHorario();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const fusos = useMemo(() => {
    const agora = new Date();
    return ['UTC', ...Intl.supportedValuesOf('timeZone')].map((valor) => ({
      valor,
      deslocamento: deslocamentoDoFuso(valor, agora),
    }));
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase().replace(/\s+/g, '_');
    if (!termo) return fusos;
    return fusos.filter(
      ({ valor, deslocamento }) =>
        valor.toLowerCase().includes(termo) ||
        deslocamento.toLowerCase().includes(termo),
    );
  }, [busca, fusos]);

  const fusoAtual = fuso;
  const rotulo = `${nomeDoFuso(fusoAtual)} (${deslocamentoDoFuso(fusoAtual)})`;

  const escolher = async (valor: string) => {
    setAberto(false);
    setBusca('');
    if (valor !== fusoSalvo) await salvar(valor);
  };

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        {collapsed ? (
          <button
            type="button"
            className="flex justify-center items-center h-10 w-10 mx-auto mb-2 rounded-md hover:bg-ei-sidebar-surface-hover cursor-pointer transition-colors duration-150"
            title={`Fuso horário: ${rotulo}`}
            data-test={dataTest}
          >
            <Globe className="w-4 h-4 shrink-0 text-ei-sidebar-text-soft" />
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-3 h-10 w-full pl-4 pr-3 mb-2 rounded-md hover:bg-ei-sidebar-surface-hover cursor-pointer transition-colors duration-150"
            title={fusoAtual}
            data-test={dataTest}
          >
            <Globe className="w-4 h-4 shrink-0 text-ei-sidebar-text-soft" />
            <span className="text-[13px] font-medium tracking-wide text-ei-sidebar-text-soft truncate">
              Fuso: {salvando ? 'salvando...' : rotulo}
            </span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-2"
        data-test={`${dataTest}-opcoes`}
      >
        <Input
          autoFocus
          placeholder="Buscar cidade ou UTC-03:00"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          data-test={`${dataTest}-busca`}
        />
        {erro && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {erro}
          </p>
        )}
        <ul className="mt-2 max-h-64 overflow-y-auto">
          {filtrados.map(({ valor, deslocamento }) => (
            <li key={valor}>
              <button
                type="button"
                onClick={() => void escolher(valor)}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent cursor-pointer"
                data-test={`${dataTest}-opcao`}
              >
                <span className="truncate">{valor.replace(/_/g, ' ')}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {deslocamento}
                  {valor === fusoSalvo && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            </li>
          ))}
          {filtrados.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">
              Nenhum fuso encontrado
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
