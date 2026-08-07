---
description: Qualidade, performance, consistência e postura frente a specs.
---

# Qualidade, Performance e Consistência

## Implementação

- Mudança pequena, coesa, focada no escopo da issue.
- Refatorar quando corrigir bug/risco/perf/complexidade/consistência exigir. Refatoração ampla fora de escopo = pedir autorização.
- Ler o código antes de alterar. Relatar inconsistência achada antes de corrigir fora de escopo.
- Preservar contratos públicos (props de componente exportado, formato de hook) salvo se a issue exigir mudança.
- Toda entrega roda `npm run fix` (lint + format) e passa por smoke manual do fluxo alterado; se houver spec Cypress cobrindo, rodar (`npx cypress run --spec "..."`).

## Performance (alvo do TCC)

- Normal: 1-3 usuários simultâneos. Sem exigência de otimização agressiva além do razoável.
- Evitar refetch redundante — usar cache do React Query em vez de buscar de novo o que já está em cache válido.
- Filtro/paginação sempre delegado à API (`nuqs` + query params) — nunca filtrar/paginar lista completa no client.
- Não bloquear a UI: computação pesada fora do render, sem loop síncrono grande em componente.

## Consistência global

- Código, validação (Zod), tipo de API (`src/types/*.ts`) e nomenclatura sempre 100% consistentes entre si.
- Padronizar nomenclatura, regra de negócio e formato de erro nos módulos afetados.
- API é fonte de verdade sobre nomes/tipos de campo — não o texto da spec (ver `api-conventions.md`).

## Specs são base, não teto

- Cumprir 100% dos contratos, campos, validações e checklists da spec.
- Verificar contrato real da API (tipo em `src/types/`, resposta real) antes de confiar na spec.
- Divergência spec×API: corrigir na implementação, seguindo o campo real da API.
- Liberdade acima da spec: UX mais rica, guards defensivos, seguir padrão do codebase.
- Aceite final: funciona, coeso visualmente, seguro, performático, robusto.
