'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  periodoEsteAno,
  periodoEsteMes,
  periodoUltimosDias,
} from '@/lib/datas';
import { useFusoAtual } from '@/hooks/use-fuso-horario';

export interface AtalhoPeriodo {
  label: string;
  calcular: () => { inicio: string; fim: string };
}

interface FiltroPeriodoProps {
  dataInicio: string;
  dataFim: string;
  onChange: (dataInicio: string, dataFim: string) => void;
  /** Atalhos exibidos ao lado do seletor de período. Default: 7/30 dias, este mês/ano. */
  atalhos?: AtalhoPeriodo[];
  /** Alinhamento do conteúdo dentro da linha — 'end' quando há outra linha de
   * controles logo abaixo alinhada à direita, pra não destoar. Default 'start'. */
  justify?: 'start' | 'end';
  /** Exibe um botão pra limpar o período selecionado. Default false. */
  permitirLimpar?: boolean;
}

// Local — usado pela seleção no calendário, pra não deslocar o dia em fusos
// horários à frente do UTC (toISOString() de uma meia-noite local nesses
// fusos cai no dia anterior em UTC).
function paraISOLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function paraDataLocal(valor: string): Date | undefined {
  if (!valor) return undefined;
  const [ano, mes, dia] = valor.split('-').map(Number);
  if (!ano || !mes || !dia) return undefined;
  return new Date(ano, mes - 1, dia);
}

function formatarLabel(valor: string): string {
  const data = paraDataLocal(valor);
  return data ? data.toLocaleDateString('pt-BR') : '';
}

const ATALHOS_PADRAO: AtalhoPeriodo[] = [
  { label: '7 dias', calcular: () => periodoUltimosDias(7) },
  { label: '30 dias', calcular: () => periodoUltimosDias(30) },
  { label: 'Este mês', calcular: periodoEsteMes },
  { label: 'Este ano', calcular: periodoEsteAno },
];

export default function FiltroPeriodo({
  dataInicio,
  dataFim,
  onChange,
  atalhos = ATALHOS_PADRAO,
  justify = 'start',
  permitirLimpar = false,
}: FiltroPeriodoProps) {
  useFusoAtual();
  const [aberto, setAberto] = useState(false);

  const range: DateRange | undefined = {
    from: paraDataLocal(dataInicio),
    to: paraDataLocal(dataFim),
  };

  const label =
    dataInicio && dataFim
      ? `${formatarLabel(dataInicio)} até ${formatarLabel(dataFim)}`
      : 'Selecionar período';

  function limpar() {
    onChange('', '');
    setAberto(false);
  }

  return (
    <div
      className={`flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap ${
        justify === 'end' ? 'sm:justify-end' : ''
      }`}
      data-test="filtro-periodo"
    >
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4 gap-2 justify-start font-normal cursor-pointer bg-background/30 hover:bg-background/50"
            data-test="filtro-periodo-trigger"
          >
            <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={range}
            defaultMonth={range.from}
            onSelect={(novoRange) => {
              if (!novoRange?.from) return;
              const inicio = paraISOLocal(novoRange.from);
              const fim = novoRange.to
                ? paraISOLocal(novoRange.to)
                : paraISOLocal(novoRange.from);
              onChange(inicio, fim);
            }}
            data-test="filtro-periodo-calendar"
          />
          {permitirLimpar && (
            <div className="border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={limpar}
                data-test="filtro-periodo-limpar-rodape"
              >
                Limpar período
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {atalhos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {atalhos.map((atalho) => (
            <Button
              key={atalho.label}
              type="button"
              variant="outline"
              className="h-11 px-4 cursor-pointer bg-background/30 hover:bg-background/50"
              onClick={() => {
                const { inicio, fim } = atalho.calcular();
                onChange(inicio, fim);
              }}
              data-test={`filtro-periodo-atalho-${atalho.label.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {atalho.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
