---
description: Princípios de engenharia obrigatórios em qualquer alteração de código.
---

# Princípios de Engenharia

## DRY — Don't Repeat Yourself

- Lógica/UI repetida em ≥2 lugares vira helper (`src/lib/`), hook (`src/hooks/`) ou componente (`src/components/`).
- Validação de negócio duplicada = fonte única de verdade — reaproveitar o schema Zod (`src/schemas/`) em vez de replicar regra em componente.
- Duplicação incidental (2 trechos parecidos por razões diferentes) NÃO é violação — não abstrair cedo demais.

## KISS — Keep It Simple

- Solução mais simples que resolve o requisito. Sem camada especulativa (context/provider/abstração "pro futuro").
- Preferir código legível a "esperto". Se precisa de comentário pra explicar o quê, simplificar.

## YAGNI — You Aren't Gonna Need It

- Implementar só o que a issue/spec pede. Sem prop/hook de extensão sem uso real.
- Sem generalizar componente/hook sem 2+ casos de uso reais.

## SOLID (subset pragmático — não dogmático)

- **SRP**: cada componente/hook = 1 responsabilidade. Componente grande demais (mistura fetch, form, layout) é sinal de quebrar em partes.
- **DIP**: componente depende de props/interface, não de implementação concreta (ex.: receber dado já resolvido, não importar `fetchData` direto num componente de apresentação).
- OCP/ISP: não forçar em componentes React — só relevante em `src/lib/` onde exista abstração real reaproveitada.
- LSP: evitar herança (não se aplica a React); preferir composição de componentes.

**Prioridade em conflito:** KISS/YAGNI vencem SOLID. Nunca adicionar abstração que YAGNI condena.
