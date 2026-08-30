import { z } from 'zod';

export const categoriaSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .max(50, 'O nome deve ter no máximo 50 caracteres'),
  descricao: z
    .string()
    .max(200, 'A descrição deve ter no máximo 200 caracteres')
    .optional(),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;

export const localizacaoSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .max(50, 'O nome deve ter no máximo 50 caracteres'),
  descricao: z
    .string()
    .max(200, 'A descrição deve ter no máximo 200 caracteres')
    .optional(),
});

export type LocalizacaoFormData = z.infer<typeof localizacaoSchema>;
