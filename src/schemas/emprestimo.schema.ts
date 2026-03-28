import { z } from 'zod';

export const emprestimoSchema = z.object({
  localizacao: z.string().min(1, 'A localização é obrigatória'),
  quantidade_emprestada: z
    .number()
    .min(1, 'A quantidade deve ser no mínimo 1')
    .max(999999999, 'A quantidade não pode exceder 999.999.999'),
  solicitante_nome: z
    .string()
    .trim()
    .min(3, 'Informe um nome com no mínimo 3 caracteres')
    .max(120, 'O nome deve ter no máximo 120 caracteres'),
  data_prevista_devolucao: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: 'Data prevista inválida',
    })
    .refine((value) => !value || new Date(value) > new Date(), {
      message: 'A data prevista deve ser futura',
    }),
  observacoes_emprestimo: z
    .string()
    .max(500, 'As observações devem ter no máximo 500 caracteres')
    .optional(),
});

export type EmprestimoFormData = z.infer<typeof emprestimoSchema>;

export const devolucaoEmprestimoSchema = z.object({
  quantidade_devolvida: z
    .number()
    .min(1, 'A quantidade deve ser no mínimo 1')
    .max(999999999, 'A quantidade não pode exceder 999.999.999'),
  observacoes_devolucao: z
    .string()
    .max(500, 'As observações devem ter no máximo 500 caracteres')
    .optional(),
});

export type DevolucaoEmprestimoFormData = z.infer<
  typeof devolucaoEmprestimoSchema
>;
