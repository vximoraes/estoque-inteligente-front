---
description: Segurança como requisito funcional. Sempre ativa.
---

# Segurança (security-first)

- Segurança = requisito funcional, não melhoria opcional.
- Validação de formulário (Zod) é UX, não segurança — a fonte de verdade de autorização é a API; nunca decidir o que renderizar/permitir baseado só em estado local sem refletir permissão real (`usePermissions()`).
- Nunca confiar em dado vindo de props/URL/localStorage sem considerar que o usuário pode adulterá-lo — ação sensível sempre revalidada pela API, não só escondida na UI.
- Nunca vazar segredo, token, cookie, hash ou detalhe interno em log de console, mensagem de erro exibida ao usuário ou payload enviado a serviço externo.
- Sem fallback silencioso em fluxo de auth — erro de login/sessão expõe estado explícito (redireciona pro `/login` ou mostra erro), nunca renderiza tela como se autenticado.
- Dependências: preferir libs maduras e mantidas. Evitar abandonadas/risco conhecido.
- Nunca expor segredo no bundle — só variável `NEXT_PUBLIC_*` vai pro cliente; qualquer chave/token sensível fica server-side (`serverFetch`, Server Component, Route Handler).
