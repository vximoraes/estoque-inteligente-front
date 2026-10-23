import { TZDate } from '@date-fns/tz';
import {
  differenceInCalendarDays,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';

type ValorData = string | number | Date | null | undefined;

export function fusoDoNavegador(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function fusoValido(fuso: unknown): fuso is string {
  if (typeof fuso !== 'string' || fuso === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: fuso });
    return true;
  } catch {
    return false;
  }
}

export const HEADER_FUSO = 'x-fuso-horario';

let fusoAtual = 'UTC';
const ouvintes = new Set<(fuso: string) => void>();

export function obterFuso(): string {
  return fusoAtual;
}

export function usarFusoNaRenderizacao(fuso: string) {
  fusoAtual = fuso;
}

export function definirFuso(fuso: string) {
  fusoAtual = fuso;
  ouvintes.forEach((ouvinte) => ouvinte(fuso));
}

export function assinarFuso(ouvinte: (fuso: string) => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function paraData(valor: ValorData): Date | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function noFuso(valor: ValorData, fuso = obterFuso()): TZDate | null {
  const data = paraData(valor);
  return data ? new TZDate(data, fuso) : null;
}

export function deslocamentoDoFuso(fuso: string, instante = new Date()) {
  return `UTC${format(new TZDate(instante, fuso), 'xxx')}`;
}

export function formatarDataHora(valor: ValorData, vazio = '-') {
  const data = noFuso(valor);
  return data ? format(data, 'dd/MM/yyyy, HH:mm') : vazio;
}

export function formatarData(valor: ValorData, vazio = '-') {
  const data = noFuso(valor);
  return data ? format(data, 'dd/MM/yyyy') : vazio;
}

export function formatarHora(valor: ValorData, vazio = '-') {
  const data = noFuso(valor);
  return data ? format(data, 'HH:mm') : vazio;
}

export function formatarDiaMes(valor: ValorData, vazio = '-') {
  const data = noFuso(valor);
  return data ? format(data, 'dd/MM') : vazio;
}

export function formatarDataCalendario(valor: ValorData, vazio = '-') {
  const data = noFuso(valor, 'UTC');
  return data ? format(data, 'dd/MM/yyyy') : vazio;
}

export function paraInputDataCalendario(valor: ValorData) {
  const data = noFuso(valor, 'UTC');
  return data ? format(data, 'yyyy-MM-dd') : '';
}

export function paraInputDataHora(valor: ValorData) {
  const data = noFuso(valor);
  return data ? format(data, "yyyy-MM-dd'T'HH:mm") : '';
}

export function deInputDataHora(valor: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor);
  if (!partes) return null;
  const [, ano, mes, dia, hora, minuto] = partes.map(Number);
  return new Date(
    new TZDate(ano!, mes! - 1, dia!, hora!, minuto!, obterFuso()).getTime(),
  );
}

export function diaNoFuso(valor: ValorData = Date.now()) {
  const data = noFuso(valor);
  return data ? format(data, 'yyyy-MM-dd') : '';
}

export function agoraNoFuso(): TZDate {
  return TZDate.tz(obterFuso());
}

export function periodoUltimosDias(dias: number) {
  const hoje = agoraNoFuso();
  return {
    inicio: format(subDays(hoje, dias - 1), 'yyyy-MM-dd'),
    fim: format(hoje, 'yyyy-MM-dd'),
  };
}

export function periodoEsteMes() {
  const hoje = agoraNoFuso();
  return {
    inicio: format(startOfMonth(hoje), 'yyyy-MM-dd'),
    fim: format(hoje, 'yyyy-MM-dd'),
  };
}

export function periodoEsteAno() {
  const hoje = agoraNoFuso();
  return {
    inicio: format(startOfYear(hoje), 'yyyy-MM-dd'),
    fim: format(hoje, 'yyyy-MM-dd'),
  };
}

export function periodoUltimosMeses(meses: number) {
  const hoje = agoraNoFuso();
  return {
    inicio: format(startOfMonth(subMonths(hoje, meses - 1)), 'yyyy-MM-dd'),
    fim: format(hoje, 'yyyy-MM-dd'),
  };
}

export function diasDeCalendarioDesde(valor: ValorData): number | null {
  const data = noFuso(valor);
  return data ? differenceInCalendarDays(agoraNoFuso(), data) : null;
}
