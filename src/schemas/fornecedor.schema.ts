import { z } from 'zod';

/**
 * Regex para validação de URL
 */
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/**
 * Schema para criação de fornecedor
 */
export const fornecedorSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  contato: z
    .string()
    .max(100, 'O contato deve ter no máximo 100 caracteres')
    .optional(),
  url: z
    .string()
    .regex(urlRegex, 'URL inválida')
    .optional()
    .or(z.literal('')),
  descricao: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .optional(),
});

export type FornecedorFormData = z.infer<typeof fornecedorSchema>;

/**
 * Schema para atualização de fornecedor (todos os campos opcionais)
 */
export const fornecedorUpdateSchema = fornecedorSchema.partial();

export type FornecedorUpdateFormData = z.infer<typeof fornecedorUpdateSchema>;
