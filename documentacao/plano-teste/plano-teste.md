# Plano de Teste

**Estoque Inteligente - Sistema de Gestão de Componentes Eletrônicos**

## 1 - Introdução

O Estoque Inteligente é um sistema web de gestão de componentes eletrônicos. O sistema foi criado para gerenciar o ciclo completo de componentes eletrônicos, incluindo cadastro, controle de estoque, movimentações (entradas e saídas), gerenciamento de fornecedores, orçamentos e geração de relatórios. Conta com funcionalidades de autenticação, gerenciamento de usuários, controle de permissões e recursos de exportação de dados. 

## 2 - Arquitetura

O sistema utiliza Next.js 15 com App Router como framework principal para o frontend, que possui uma arquitetura orientada a componentes com React 19. A aplicação implementa Server-Side Rendering (SSR) e Client-Side Rendering (CSR) conforme necessário.

**Stack Tecnológica:**
- **Frontend:** Next.js 15, React 19, TypeScript
- **Estilização:** TailwindCSS 4
- **Gerenciamento de Estado:** React Query (TanStack Query v5)
- **Validação de Formulários:** React Hook Form + Zod
- **Autenticação:** NextAuth.js v4
- **UI Components:** Radix UI
- **Notificações:** React Toastify
- **Testes E2E:** Cypress
- **Containerização:** Docker

Para o armazenamento, consulta e alteração de dados da aplicação, o sistema consome uma API REST que disponibiliza endpoints para todas as entidades do sistema (componentes, fornecedores, orçamentos, usuários, movimentações, etc.). A comunicação é feita através de requisições HTTP com autenticação via Bearer Token, retornando dados em formato JSON.

**Fluxo de Arquitetura:**
1. Cliente (Next.js App) → Requisição HTTP com Token JWT
2. API REST → Processa e valida requisição
3. Retorna resposta JSON com dados paginados
4. Cliente atualiza estado e UI usando React Query


## 3 - Categorização dos Requisitos em Funcionais x Não Funcionais

Requisito Funcional | Requisito Não Funcional
-----------|--------
RF001 – O sistema deve permitir o cadastro de usuários pelo admin: nome, e-mail único e senha segura, que será redefinida pelo usuário através do e-mail. | NF001 – O sistema deve exibir mensagens de feedback (toast notifications)
RF002 – O sistema deve permitir que usuários cadastrados acessem suas contas existentes para gerenciar seus componentes, utilizando autenticação segura via JWT. | NF002 – O sistema deve implementar proteção de rotas autenticadas
RF003 – O sistema deve permitir gerenciar componentes com campos essenciais, validando categoria/localização e nome único; ajuste de quantidade só por movimentação. | NF003 – O sistema deve ser acessível via navegadores modernos
RF004 – O sistema deve gerar alertas automáticos (estoque abaixo do mínimo, indisponibilidade, entradas/saídas), registrá-los e exibí-los aos usuários. | 
RF005 – O sistema deve detalhar componentes e atualizar estoque em tempo real.
RF006 – O sistema deve possuir mecanismos de busca e filtragem por nome, status, categoria, localização e fornecedor, permitindo consultas rápidas e precisas.
RF007 – O sistema deve permitir a criação de orçamentos, informando nome e componentes com seus devidos campos.
RF008 – O sistema deve permitir gerenciar categorias, localizações e fornecedores.
RF009 – O sistema deve permitir visualizar e emitir relatórios de estoque, movimentações e orçamentos.


### Casos de Teste

#### Componentes

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Listagem de Componentes | ● Ao entrar na tela, o usuário deve visualizar todos os componentes cadastrados em formato de cards. <br> ● Cada card deve exibir imagem (ou ícone padrão), nome, categoria, quantidade, estoque mínimo e status.| ● Todos os componentes do usuário são listados <br> ● Cards com informações corretas. | ● Componentes carregados corretamente com suas devidas informações
Estatísticas | ● No topo da tela devem ser exibidos 4 cards com estatísticas. <br> ● Cards: Total de componentes, Em estoque, Baixo estoque, Indisponível. <br> ● Cada card deve ter ícone e cor específica. <br> ● Contadores devem ser atualizados automaticamente após qualquer operação. | ● Cards sendo carregados corretamente <br> ● Contadores atualizando após operações de entrada e saída de componentes | ● Estatísticas precisas <br> ● Atualização em tempo real
Pesquisa | ● Ao digitar no campo de pesquisa, deve filtrar componentes por nome em tempo real. <br> ● Deve exibir mensagem "Nenhum componente encontrado para sua pesquisa." quando não encontrar resultados. <br> ● Ao limpar o campo, deve voltar a exibir todos os componentes. <br> ● Deve funcionar em conjunto com filtros aplicados. | ● Pesquisa em tempo real funcional <br> ● Busca por correspondência parcial <br> ● Mensagem quando não há resultados <br> ● Limpar campo restaura listagem <br> ● Compatível com filtros de categoria e status | ● Resultados corretos de busca
Filtros | ● Ao clicar em "Filtros", deve abrir modal com opções de filtro por Categoria e Status. <br>● Categorias devem ser carregadas dinamicamente da API. <br>● Status tem 3 opções fixas: Em Estoque, Baixo Estoque, Indisponível. <br>● Após aplicar, deve exibir tags visuais dos filtros ativos com botão (X) para remover. <br>● Deve ser possível aplicar filtros combinados. <br>● Filtros devem persistir na URL. | ● Modal abre e fecha corretamente <br>● Lista de categorias carregada <br>● Filtros aplicados corretamente <br>● Tags visuais dos filtros ativos <br>● Remoção individual de filtros funciona <br>● Botão "Limpar filtros" remove todos <br>● Filtros na URL (query params) | ● Filtros precisos <br>● Visual claro dos filtros ativos <br>● Persistência na URL
Adicionar Componente | ● Ao clicar em "Adicionar", deve redirecionar para tela de cadastro. <br>● Formulário com campos: Nome* (máx 100), Categoria* (dropdown + botão criar), Estoque Mínimo (0-999.999.999), Descrição (máx 200), Imagem (opcional). <br>● Validações em tempo real. <br>● Upload de imagem por clique ou drag and drop. <br>● Após salvar, redirecionar para listagem com toast "Componente criado com sucesso!". | ● Nome obrigatório e não vazio <br>● Categoria obrigatória <br>● Estoque mínimo entre 0 e 999.999.999 <br>● Contadores de caracteres funcionais <br>● Upload de imagem funcional <br>● Criar categoria durante cadastro funciona <br>● Validações em tempo real <br>● Mensagens de erro claras <br>● Toast de confirmação | ● Componente cadastrado com sucesso <br>● Todas as validações funcionando <br>● Experiência fluida
Editar Componente | ● Ao clicar em "Editar" no menu do card, deve redirecionar para tela de edição. <br>● Todos os campos pré-preenchidos com dados atuais. <br>● Mesmas validações do cadastro. <br>● Quantidade não editável diretamente (apenas via movimentações). <br>● Ao salvar, exibir toast "Componente atualizado com sucesso. Porém, a quantidade só pode ser alterada por movimentação." e redirecionar. | ● Dados pré-carregados corretamente <br>● Validações mantidas <br>● Quantidade não editável <br>● Status recalculado se alterar estoque mínimo <br>● Possibilidade de alterar/remover imagem <br>● Toast informativo <br>● Redirecionamento após salvar | ● Componente atualizado corretamente <br>● Status recalculado quando necessário
Excluir Componente | ● Ao clicar em "Excluir" no menu, deve abrir modal de confirmação. <br>● Modal deve exibir o nome do componente. <br>● Opções: "Cancelar" e "Excluir". <br>● Ao confirmar, componente é removido permanentemente. <br>● Exibir toast "Componente excluído com sucesso!". <br>● Lista atualizada automaticamente. <br>● Se era o último item da página, voltar para página anterior. | ● Modal de confirmação claro <br>● Nome do componente exibido <br>● Botão "Excluir" em vermelho <br>● Cancelamento funciona <br>● Exclusão permanente <br>● Toast de confirmação <br>● Listagem atualizada <br>● Paginação ajustada <br>● Estatísticas recalculadas | ● Componente excluído permanentemente <br>● Confirmação obrigatória <br>● Feedback apropriado
Entrada de Componente | ● Ao clicar em "Entrada" no menu, deve abrir modal. <br>● Formulário com: Localização* (dropdown) e Quantidade* (1-999.999.999). <br>● Ao confirmar, criar movimentação de entrada. <br>● Quantidade total do componente atualizada automaticamente. <br>● Estoque da localização criado ou atualizado. <br>● Status recalculado (pode mudar de Indisponível→Baixo Estoque ou Baixo Estoque→Em Estoque). <br>● Exibir toast "Entrada registrada com sucesso!". <br>● Card mostra loading e depois novos valores. | ● Localização obrigatória <br>● Quantidade obrigatória e > 0 <br>● Máximo 999.999.999 <br>● Movimentação criada <br>● Estoque atualizado/criado <br>● Quantidade total aumentada <br>● Status recalculado corretamente <br>● Toast de confirmação <br>● Loading no card <br>● Estatísticas atualizadas | ● Entrada registrada com sucesso <br>● Estoque atualizado corretamente <br>● Status recalculado automaticamente
Saída de Componente | ● Ao clicar em "Saída" no menu, deve abrir modal. <br>● Formulário com: Localização* (dropdown - apenas com estoque) e Quantidade*. <br>● Validar se há estoque suficiente na localização antes de salvar. <br>● Se quantidade > disponível, exibir erro. <br>● Ao confirmar, criar movimentação de saída. <br>● Quantidade total diminuída. <br>● Status recalculado (pode mudar de Em Estoque→Baixo Estoque ou Baixo Estoque→Indisponível). <br>● Exibir toast "Saída registrada com sucesso!". | ● Localização obrigatória <br>● Apenas localizações com estoque <br>● Quantidade obrigatória e > 0 <br>● Validação de estoque suficiente <br>● Mensagem de erro clara <br>● Movimentação criada <br>● Estoque diminuído <br>● Status recalculado <br>● Toast de confirmação <br>● Estatísticas atualizadas | ● Saída registrada com sucesso <br>● Validação de estoque disponível <br>● Não permitir saída maior que disponível
Visualizar Localizações | ● Ao clicar no card (área principal), deve abrir modal "Localizações". <br>● Exibir nome e descrição do componente. <br>● Listar todas as localizações com suas respectivas quantidades. <br>● Exibir quantidade total no rodapé. <br>● Se não houver localizações, exibir mensagem apropriada. <br>● Loading durante carregamento. | ● Clicar no card abre modal <br>● Nome e descrição exibidos <br>● Lista de localizações carregada <br>● Quantidade por localização <br>● Quantidade total correta <br>● Mensagem se sem localizações <br>● Loading funcional <br>● Botão fechar funcional | ● Modal informativo <br>● Dados corretos e atualizados <br>● Visual claro
Paginação | ● Quando houver mais componentes que cabem na página, exibir controles de paginação no rodapé. <br>● Botões: Anterior (seta), números das páginas, Próxima (seta). <br>● Página atual destacada em azul. <br>● Botões "Anterior" e "Próxima" desabilitados nos limites. <br>● Para muitas páginas (>7), usar reticências (...). <br>● Ao pesquisar ou filtrar, voltar para página 1. | ● Paginação aparece quando necessário <br>● Botões funcionais <br>● Página atual destacada <br>● Botões desabilitados nos limites <br>● Reticências para muitas páginas <br>● Navegação fluida <br>● Cálculo correto de páginas <br>● Reset para página 1 ao pesquisar/filtrar | ● Navegação clara e funcional <br>● Indicadores visuais apropriados
Upload de Imagem | ● Campo de imagem opcional no cadastro/edição. <br>● Upload por clique ou drag and drop. <br>● Formatos aceitos: JPG, JPEG, PNG, GIF, WEBP. <br>● Exibir preview miniatura. <br>● Botão (X) para remover imagem. <br>● Feedback visual durante drag. <br>● Rejeitar formatos não suportados. <br>● Na listagem, exibir imagem no card ou ícone padrão. | ● Upload por clique funciona <br>● Upload por drag and drop funciona <br>● Validação de formato <br>● Preview funcional <br>● Remoção de imagem funciona <br>● Feedback visual no drag <br>● Imagem salva no servidor <br>● Exibição correta na listagem <br>● Possibilidade de alterar/remover na edição | ● Upload opcional funcionando <br>● Validação de formato <br>● Boa experiência de usuário
Status Automático | ● Status calculado automaticamente pelo backend. <br>● Regras: quantidade = 0 → "Indisponível" (vermelho), 0 < quantidade < estoque_mínimo → "Baixo Estoque" (amarelo), quantidade >= estoque_mínimo → "Em Estoque" (verde). <br>● Atualizado após: criação, entrada, saída, edição de estoque mínimo. <br>● Badge colorido no card. | ● Status correto em todos os cenários <br>● Indisponível quando qtd = 0 <br>● Baixo Estoque quando 0 < qtd < min <br>● Em Estoque quando qtd >= min <br>● Atualização automática <br>● Badge com cores corretas <br>● Sincronização com estatísticas | ● Status sempre correto <br>● Cores intuitivas <br>● Atualização automática

#### Orçamentos

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Listagem de Orçamentos | ● Ao entrar na tela, o usuário deve visualizar todos os orçamentos cadastrados em formato de tabela. <br> ● A tabela deve exibir colunas: Nome, Descrição, Total e Ações. <br> ● O total deve ser exibido em formato monetário (R$ X,XX). |  ● Colunas com informações corretas <br> ● Formatação monetária aplicada | ● Orçamentos carregados corretamente com suas devidas informações
Pesquisa | ● Ao digitar no campo de pesquisa, deve filtrar orçamentos por nome em tempo real. <br> ● Deve exibir mensagem "Nenhum orçamento encontrado para sua pesquisa." quando não encontrar resultados. <br> ● Ao limpar o campo, deve voltar a exibir todos os orçamentos. | ● Pesquisa em tempo real funcional <br> ● Mensagem quando não há resultados <br> ● Limpar campo restaura listagem | ● Resultados corretos de busca
Adicionar Orçamento | ● Ao clicar em "Adicionar", deve redirecionar para tela de cadastro. <br> ● Formulário com campos: Nome* (máx 100) e Descrição (máx 200, opcional). <br> ● Contadores de caracteres funcionais. <br> ● Tabela de itens do orçamento com colunas: Nome, Fornecedor, Quantidade, Valor Unitário, Subtotal, Ações. <br> ● Total geral calculado automaticamente. <br> ● Após salvar, redirecionar para listagem com toast "Orçamento criado com sucesso!". | ● Nome obrigatório e não vazio <br> ● Máximo 100 caracteres para nome <br> ● Máximo 200 caracteres para descrição <br> ● Contadores de caracteres funcionais <br> ● Pelo menos um componente obrigatório <br> ● Total calculado corretamente <br> ● Toast de confirmação | ● Orçamento cadastrado com sucesso <br> ● Todas as validações funcionando <br> ● Experiência fluida
Seleção de Componentes | ● Ao clicar em "Adicionar componente", deve abrir modal de seleção. <br> ● Modal permite seleção múltipla de componentes. <br> ● Campo de pesquisa para filtrar componentes por nome. <br> ● Componentes exibidos em grid de cards com imagem, nome e categoria. <br> ● Indicador visual dos componentes selecionados (borda azul). <br> ● Contador de componentes selecionados no header do modal. <br> ● Scroll infinito no modal para carregar mais componentes. <br> ● Botão "Adicionar X componentes" habilitado quando há seleção. | ● Modal abre e fecha corretamente <br> ● Seleção múltipla funcional <br> ● Pesquisa filtra componentes <br> ● Visual de seleção claro <br> ● Contador atualiza em tempo real <br> ● Scroll infinito funcional <br> ● Componentes adicionados à tabela | ● Seleção intuitiva <br> ● Múltiplos componentes de uma vez
Seleção de Fornecedor | ● Cada componente deve ter dropdown para selecionar fornecedor. <br> ● Dropdown abre ao clicar no campo. <br> ● Campo de pesquisa dentro do dropdown para filtrar fornecedores. <br> ● Scroll infinito para carregar mais fornecedores. <br> ● Ao selecionar, nome do fornecedor é exibido no campo. <br> ● Fornecedor é obrigatório para salvar o orçamento. | ● Dropdown abre e fecha corretamente <br> ● Pesquisa de fornecedores funcional <br> ● Scroll infinito no dropdown <br> ● Fornecedor selecionado exibido <br> ● Validação de obrigatoriedade | ● Seleção clara e rápida <br> ● Fornecedor obrigatório validado
Quantidade do Componente | ● Campo de quantidade com valor inicial 1. <br> ● Botões + e - para incrementar/decrementar. <br> ● Mínimo 1, máximo 999.999.999. <br> ● Botão - desabilitado quando quantidade = 1. <br> ● Subtotal recalculado automaticamente ao alterar. <br> ● Campo permite digitação direta. | ● Valor inicial 1 <br> ● Botões + e - funcionais <br> ● Limite mínimo 1 respeitado <br> ● Limite máximo respeitado <br> ● Subtotal atualizado <br> ● Digitação direta funciona | ● Quantidade sempre válida <br> ● Cálculos corretos
Valor Unitário | ● Campo numérico para informar valor unitário. <br> ● Aceita valores decimais (2 casas). <br> ● Valor mínimo: 0. <br> ● Subtotal = quantidade × valor unitário. <br> ● Total do orçamento atualizado automaticamente. | ● Campo aceita decimais <br> ● Valor mínimo 0 <br> ● Subtotal calculado corretamente <br> ● Total atualizado em tempo real | ● Valores sempre válidos <br> ● Cálculos precisos
Remover Componente | ● Botão de lixeira para remover componente da tabela. <br> ● Ao remover, total do orçamento é recalculado. <br> ● Se remover todos, exibir mensagem "Nenhum componente adicionado.". | ● Botão de remoção funcional <br> ● Total recalculado <br> ● Mensagem quando lista vazia | ● Remoção sem confirmação <br> ● Cálculos atualizados
Validações no Cadastro | ● Nome é obrigatório, exibir erro se vazio. <br> ● Pelo menos um componente deve ser adicionado. <br> ● Todos componentes devem ter fornecedor selecionado. <br> ● Mensagens de erro via toast. <br> ● Botão "Salvar" desabilitado durante processamento. | ● Erro se nome vazio <br> ● Erro se sem componentes <br> ● Erro se componente sem fornecedor <br> ● Toasts de erro claros <br> ● Estado de loading no botão | ● Validações claras <br> ● Não permite salvar inválido
Editar Orçamento | ● Ao clicar em "Editar" na listagem, redirecionar para tela de edição. <br> ● Campos pré-preenchidos com dados atuais. <br> ● Mesmas validações do cadastro. <br> ● Pode adicionar novos componentes. <br> ● Pode remover componentes existentes. <br> ● Pode alterar fornecedor, quantidade e valor de componentes. <br> ● Ao salvar, exibir toast "Orçamento atualizado com sucesso!" e redirecionar. | ● Dados carregados corretamente <br> ● Validações mantidas <br> ● Adição de componentes funciona <br> ● Remoção de componentes funciona <br> ● Alteração de valores funciona <br> ● Toast de confirmação <br> ● Redirecionamento após salvar | ● Edição completa funcional <br> ● Dados persistidos corretamente
Excluir Orçamento | ● Ao clicar em "Excluir" na listagem, abrir modal de confirmação. <br> ● Modal exibe nome do orçamento. <br> ● Opções: "Cancelar" e "Excluir". <br> ● Ao confirmar, orçamento é inativado (soft delete). <br> ● Exibir toast "Orçamento excluído com sucesso!". <br> ● Lista atualizada automaticamente. | ● Modal de confirmação claro <br> ● Nome do orçamento exibido <br> ● Botão "Excluir" em vermelho <br> ● Cancelamento funciona <br> ● Inativação funcional <br> ● Toast de confirmação <br> ● Listagem atualizada | ● Confirmação obrigatória <br> ● Feedback apropriado <br> ● Orçamento não mais exibido
Visualizar Detalhes | ● Ao clicar no ícone de olho, abrir modal de detalhes. <br> ● Modal exibe nome do orçamento no header. <br> ● Exibe descrição (se houver). <br> ● Exibe total em destaque (azul). <br> ● Tabela de componentes: Nome, Qtd, Valor Unit., Subtotal. <br> ● Exibe datas de criação e atualização. <br> ● Modal fecha ao clicar fora, no X ou tecla ESC. | ● Modal abre corretamente <br> ● Nome e descrição exibidos <br> ● Total em destaque <br> ● Tabela de componentes completa <br> ● Datas formatadas (dd/mm/aaaa hh:mm) <br> ● Fechamento por múltiplas formas | ● Informações completas <br> ● Visual claro e organizado
Cancelar Operação | ● Botão "Cancelar" nas telas de adicionar e editar. <br> ● Ao clicar, redirecionar para listagem sem salvar. <br> ● Dados não são persistidos. | ● Botão cancelar funcional <br> ● Redirecionamento correto <br> ● Dados descartados | ● Navegação clara <br> ● Sem efeitos colaterais
Tratamento de Erros | ● Exibir mensagem de erro se falhar ao carregar orçamentos. <br> ● Toast de erro se falhar ao criar/editar/excluir. <br> ● Toast de erro se falhar ao gerar PDF. <br> ● Mensagens claras e específicas. | ● Erro na listagem exibido <br> ● Toast de erro nas operações <br> ● Mensagens descritivas | ● Usuário informado sobre falhas <br> ● Possibilidade de tentar novamente

#### Usuários

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Listagem de Usuários | ● Ao entrar na tela, o usuário deve visualizar todos os usuários cadastrados em formato de tabela. <br> ● A tabela deve exibir colunas: Nome, E-mail, Status e Ações. <br> ● Status pode ser "Ativo" (verde) ou "Aguardando ativação" (amarelo). | ● Todos os usuários são listados <br> ● Colunas com informações corretas <br> ● Status correto para cada usuário | ● Usuários carregados corretamente com suas devidas informações
Pesquisa | ● Ao digitar no campo de pesquisa, deve filtrar usuários por nome em tempo real. <br> ● Deve exibir mensagem "Nenhum usuário encontrado." quando não encontrar resultados. <br> ● Ao limpar o campo, deve voltar a exibir todos os usuários. | ● Pesquisa em tempo real funcional <br> ● Busca por correspondência parcial <br> ● Mensagem quando não há resultados <br> ● Limpar campo restaura listagem | ● Resultados corretos de busca
Cadastrar Usuário | ● Ao clicar em "Cadastrar usuário", deve abrir modal de cadastro. <br> ● Formulário com campos: Nome* (máx 100) e E-mail* (válido). <br> ● Contadores de caracteres funcionais. <br> ● Validar formato de e-mail. <br> ● Modal pode ser fechado de múltiplas formas (X, ESC, fora, cancelar). <br> ● **Nota:** Cadastro real não testado (envia e-mail). | ● Modal abre e fecha corretamente <br> ● Nome obrigatório e não vazio <br> ● E-mail obrigatório e válido <br> ● Máximo 100 caracteres para nome <br> ● Contador de caracteres funcional <br> ● Validações em tempo real <br> ● Mensagens de erro claras <br> ● Erro para e-mail duplicado (simulado) | ● Todas as validações funcionando <br> ● Experiência fluida no formulário <br> ● **Cadastro real não testado**
Visualizar Detalhes | ● Ao clicar no ícone de olho, deve abrir modal de detalhes. <br> ● Modal exibe: Nome (no header), E-mail, Status (Ativo/Aguardando ativação). <br> ● Botão copiar apenas para E-mail. <br> ● Feedback visual ao copiar (ícone de check temporário). <br> ● Modal fecha ao clicar fora, no X ou tecla ESC. | ● Modal abre corretamente <br> ● Todos os dados exibidos <br> ● Botão de copiar funcional <br> ● Feedback visual ao copiar <br> ● Fechamento por múltiplas formas | ● Informações completas <br> ● Visual claro e organizado <br> ● Copiar funcional
Excluir Usuário | ● Ao clicar no ícone de lixeira, deve abrir modal de confirmação. <br> ● Modal deve exibir o nome do usuário. <br> ● Opções: "Cancelar" e "Excluir". <br> ● Modal pode ser fechado de múltiplas formas (X, ESC, fora, cancelar). <br> ● **Nota:** Exclusão real não testada (exclui usuário do banco). | ● Modal de confirmação claro <br> ● Nome do usuário exibido <br> ● Botão "Excluir" em vermelho <br> ● Cancelamento funciona <br> ● Fechamento por múltiplas formas <br> ● Tratamento de erros simulados | ● Confirmação obrigatória <br> ● Feedback apropriado <br> ● **Exclusão real não testada**
Scroll Infinito | ● Ao rolar a tabela até o final, carregar mais usuários automaticamente. <br> ● Exibir loading durante carregamento de próxima página. <br> ● Não duplicar usuários na lista. <br> ● Quando não houver mais usuários, parar de carregar. | ● Scroll infinito funcional <br> ● Loading visível <br> ● Sem duplicação <br> ● Para quando não há mais dados <br> ● Performance fluida | ● Navegação contínua <br> ● Boa experiência de usuário
Estado Vazio | ● Quando não há usuários cadastrados, exibir mensagem "Nenhum usuário cadastrado.". <br> ● Mensagem centralizada e clara. <br> ● Botão "Cadastrar usuário" continua visível. | ● Mensagem apropriada exibida <br> ● Visual claro <br> ● Botão de cadastro acessível | ● Orientação clara para o usuário
Loading Inicial | ● Ao carregar a página, exibir spinner de loading. <br> ● Mensagem "Carregando usuários...". <br> ● Spinner animado visualmente claro. | ● Loading exibido <br> ● Mensagem de carregamento <br> ● Spinner animado | ● Feedback visual durante carregamento
Validações no Modal de Cadastro | ● Nome é obrigatório, exibir erro se vazio. <br> ● E-mail é obrigatório e deve ser válido. <br> ● Não permitir e-mail duplicado. <br> ● Mensagens de erro via toast. <br> ● Botão "Cadastrar" desabilitado durante processamento. | ● Erro se nome vazio <br> ● Erro se e-mail vazio ou inválido <br> ● Erro se e-mail já existe <br> ● Toasts de erro claros <br> ● Estado de loading no botão | ● Validações claras <br> ● Não permite cadastrar inválido
Tratamento de Erros | ● Exibir mensagem de erro se falhar ao carregar usuários. <br> ● Toast de erro se falhar ao cadastrar/excluir. <br> ● Toast de erro se falhar ao reenviar convite. <br> ● Mensagens claras e específicas. | ● Erro na listagem exibido <br> ● Toast de erro nas operações <br> ● Mensagens descritivas | ● Usuário informado sobre falhas <br> ● Possibilidade de tentar novamente
Fechamento de Modais | ● Todos os modais devem fechar ao: Clicar no X, Clicar fora do modal, Pressionar tecla ESC, Clicar em Cancelar/Fechar. <br> ● Ao fechar, limpar dados do formulário. | ● X funcional <br> ● Clique fora fecha <br> ● ESC fecha <br> ● Botões cancelar/fechar funcionam <br> ● Formulário resetado | ● Múltiplas formas de fechar <br> ● Estado limpo após fechar
Responsividade | ● Tabela deve ser responsiva com scroll horizontal em telas pequenas. <br> ● Botões de ação devem ser visíveis e clicáveis em todos os tamanhos. <br> ● Modais devem se adaptar ao tamanho da tela. | ● Scroll horizontal em mobile <br> ● Botões acessíveis <br> ● Modais responsivos <br> ● Texto truncado quando necessário | ● Experiência consistente em todos os dispositivos

#### Perfil

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Exibição de Informações | ● Ao entrar na tela, exibir nome, e-mail e avatar do usuário. <br> ● Avatar exibido no container apropriado. <br> ● Informações carregadas do backend. | ● Nome visível <br> ● E-mail visível <br> ● Avatar container existe | ● Informações do usuário exibidas corretamente
Estatísticas do Usuário | ● Exibir cards com estatísticas: Total de Componentes, Total de Movimentações, Total de Orçamentos. <br> ● Valores devem ser numéricos. <br> ● Valores carregados dinamicamente. | ● Total de componentes visível <br> ● Total de movimentações visível <br> ● Total de orçamentos visível <br> ● Valores numéricos corretos | ● Estatísticas precisas e atualizadas
Área de Notificações | ● Renderizar seção de notificações. <br> ● Exibir lista de notificações se houver. <br> ● Exibir mensagem "Nenhuma notificação" se lista vazia. | ● Seção de notificações visível <br> ● Lista ou mensagem de vazio exibida corretamente | ● Notificações acessíveis na tela de perfil
Edição de Perfil | ● Botão "Editar perfil" abre modal de edição. <br> ● Modal exibe campo de nome pré-preenchido. <br> ● Modal pode ser fechado pelo X. <br> ● Ao salvar com novo nome, perfil é atualizado. <br> ● Botão salvar desabilitado durante processamento. <br> ● Ao cancelar, mantém nome original. | ● Modal abre corretamente <br> ● Campo nome pré-preenchido <br> ● Botão X fecha modal <br> ● Nome atualizado após salvar <br> ● Botão desabilitado ao salvar <br> ● Cancelar mantém dados originais | ● Edição de nome funcional <br> ● Feedback apropriado
Edição de Foto | ● Botão "Editar foto" abre modal de edição de avatar. <br> ● Modal permite selecionar arquivo de imagem. <br> ● Botão X fecha modal. <br> ● Botão salvar fica desabilitado durante upload. <br> ● Modal fecha após upload bem-sucedido. <br> ● Botão "Remover foto" abre modal de confirmação. <br> ● Modal de confirmação pode ser cancelado. | ● Modal de foto abre corretamente <br> ● Seleção de arquivo funcional <br> ● Botão X fecha modal <br> ● Botão salvar desabilitado durante upload <br> ● Modal fecha após upload <br> ● Modal de confirmação funcional <br> ● Cancelar remoção funciona | ● Upload de foto funcional <br> ● Confirmação de remoção obrigatória

#### Notificações

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Criação de Notificações | ● Ao cadastrar componente, criar notificação correspondente. <br> ● Ao realizar entrada de componente, gerar notificação. <br> ● Notificações aparecem na lista. | ● Notificação criada após cadastro <br> ● Notificação criada após entrada <br> ● Lista de notificações atualizada | ● Notificações geradas automaticamente
Mensagem de Status | ● Notificação deve exibir status correto do componente. <br> ● Para "Em Estoque": mensagem com quantidade em estoque. <br> ● Para "Baixo Estoque": mensagem com quantidade baixa. <br> ● Para "Indisponível": mensagem com quantidade zero. <br> ● Mensagem deve incluir nome do componente e quantidade. | ● Mensagem de "Em Estoque" correta <br> ● Mensagem de "Baixo Estoque" correta <br> ● Mensagem de "Indisponível" correta <br> ● Nome do componente na mensagem <br> ● Quantidade na mensagem | ● Mensagens precisas e descritivas
Marcar como Visualizada | ● Notificações não lidas exibem indicador visual. <br> ● Ao clicar no indicador, marcar notificação como visualizada. <br> ● Indicador deve desaparecer após marcar. <br> ● Notificação permanece na lista após visualização. | ● Indicador de não lida visível <br> ● Clique no indicador funciona <br> ● Indicador removido após clique <br> ● Notificação continua na lista | ● Marcação individual funcional
Marcar Todas como Visualizadas | ● Botão "Marcar todas como visualizadas" disponível. <br> ● Ao clicar, todas as notificações não lidas são marcadas. <br> ● Todos os indicadores de não lida desaparecem. <br> ● Múltiplas notificações processadas de uma vez. | ● Botão funcional <br> ● Todas as notificações marcadas <br> ● Nenhum indicador de não lida após ação <br> ● Múltiplas notificações atualizadas | ● Marcação em lote funcional

#### Relatórios

##### Relatórios de Componentes

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Listagem de Relatório | ● Ao entrar na tela, exibir tabela com todos os componentes e suas localizações. <br> ● Colunas da tabela: Checkbox, Código, Componente, Quantidade, Status, Localização. <br> ● Cada linha representa um componente em uma localização específica. <br> ● Todos os cabeçalhos devem estar visíveis e com nomes corretos. | ● Tabela carregada corretamente <br> ● Todos os cabeçalhos visíveis <br> ● Dados nas colunas corretas <br> ● Checkbox no header e em cada linha | ● Relatório completo e organizado
Seleção com Checkboxes | ● Checkbox no cabeçalho para selecionar/desselecionar todos. <br> ● Checkbox em cada linha para seleção individual. <br> ● Ao marcar checkbox mãe, todos os checkboxes filhos devem ser marcados. <br> ● Ao desmarcar checkbox mãe, todos os checkboxes filhos devem ser desmarcados. <br> ● Estado dos checkboxes deve ser visível (checked/unchecked). | ● Checkbox mãe funcional <br> ● Seleciona todos ao clicar <br> ● Desmarca todos ao clicar novamente <br> ● Checkboxes individuais sincronizados <br> ● Estado visual claro | ● Seleção múltipla funcional
Filtros por Status | ● Botão "Filtros" para abrir modal de filtros. <br> ● Dropdown para selecionar status: Em Estoque, Baixo Estoque, Indisponível. <br> ● Ao aplicar filtro, exibir apenas componentes do status selecionado. <br> ● Tag visual do filtro ativo com botão (X) para remover. <br> ● Modal fecha após aplicar filtros. | ● Modal de filtros abre e fecha <br> ● Dropdown de status funcional <br> ● Filtro aplicado corretamente <br> ● Apenas itens do status aparecem <br> ● Tag do filtro visível <br> ● Remoção do filtro funcional | ● Filtros precisos e fáceis de usar
Exportação de Dados | ● Botão "Exportar" habilitado apenas com itens selecionados. <br> ● Modal de exportação com campo de nome do arquivo. <br> ● Opções de formato: PDF e CSV. <br> ● Ao confirmar, gerar arquivo para download. <br> ● Modal fecha após exportação. | ● Botão desabilitado sem seleção <br> ● Modal de exportação funcional <br> ● Nome de arquivo editável <br> ● Formatos PDF e CSV disponíveis <br> ● Download gerado <br> ● Modal fecha após exportar | ● Exportação funcional nos 2 formatos

##### Relatórios de Movimentações

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Listagem de Movimentações | ● Ao entrar na tela, exibir tabela com todas as movimentações. <br> ● Colunas: Checkbox, Código, Produto, Quantidade, Tipo (Entrada/Saída), Localização, Data. <br> ● Badge colorido para tipo: verde para Entrada, vermelho para Saída. <br> ● Todos os cabeçalhos visíveis e corretos. | ● Tabela carregada corretamente <br> ● Cabeçalhos visíveis <br> ● Dados nas colunas corretas <br> ● Badge de tipo com cores corretas <br> ● Checkbox funcional | ● Movimentações exibidas corretamente
Estatísticas | ● Cards no topo com: Total de Movimentações, Total de Entradas, Total de Saídas. <br> ● Contadores atualizados em tempo real conforme filtros/pesquisas. <br> ● No modo mobile, estatísticas em bloco expansível com botão toggle. | ● Cards de estatísticas visíveis <br> ● Valores corretos exibidos <br> ● Atualização ao filtrar/pesquisar <br> ● Toggle funcional em mobile <br> ● Bloco expande/contrai | ● Estatísticas precisas e atualizadas
Pesquisa | ● Campo de pesquisa para filtrar por nome do produto. <br> ● Busca em tempo real por correspondência parcial. <br> ● Exibir mensagem de estado vazio quando não encontrar resultados. <br> ● Estatísticas atualizam conforme pesquisa. | ● Pesquisa em tempo real funcional <br> ● Filtro por nome do produto <br> ● Mensagem de estado vazio <br> ● Estatísticas recalculadas | ● Busca eficiente e precisa
Filtros por Tipo | ● Botão "Filtros" para abrir modal. <br> ● Dropdown para selecionar tipo: Entrada ou Saída. <br> ● Ao aplicar, listar apenas movimentações do tipo selecionado. <br> ● Tag visual do filtro ativo com botão (X) para remover. <br> ● Modal fecha após aplicar. | ● Modal de filtros funcional <br> ● Dropdown de tipo funcional <br> ● Filtro aplicado corretamente <br> ● Tag do filtro visível <br> ● Remoção pelo X funcional <br> ● Estatísticas atualizadas | ● Filtros precisos por tipo
Seleção e Exportação | ● Checkboxes para seleção individual de movimentações. <br> ● Botão "Exportar" habilitado com itens selecionados. <br> ● Modal de exportação com campo de nome e opções PDF/CSV. <br> ● Exportação gera arquivo para download. <br> ● Suporta seleção múltipla para exportação. | ● Seleção múltipla funcional <br> ● Botão exportar habilitado corretamente <br> ● Modal de exportação funcional <br> ● PDF e CSV funcionam <br> ● Download gerado <br> ● Modal fecha após exportar | ● Exportação funcional em ambos formatos

##### Relatórios de Orçamentos

---
Funcionalidades | Comportamento Esperado | Verificações | Critérios de Aceite
-----------|--------|--------|--------
Listagem de Relatório | ● Ao entrar na tela, exibir tabela com todos os orçamentos. <br> ● Colunas: Checkbox, Código, Nome, Descrição, Itens, Valor Total, Data. <br> ● Valor total em formato monetário (R$ X,XX). <br> ● Todos os cabeçalhos visíveis e corretos. | ● Tabela carregada corretamente <br> ● Cabeçalhos visíveis <br> ● Dados nas colunas corretas <br> ● Formatação monetária aplicada <br> ● Checkbox funcional | ● Orçamentos exibidos corretamente
Seleção com Checkboxes | ● Checkbox no cabeçalho para selecionar/desselecionar todos. <br> ● Checkbox em cada linha para seleção individual. <br> ● Ao marcar checkbox mãe, todos os filhos marcam. <br> ● Ao desmarcar checkbox mãe, todos os filhos desmarcam. | ● Checkbox mãe funcional <br> ● Seleciona/desmarca todos <br> ● Sincronização visual correta <br> ● Estado claro (checked/unchecked) | ● Seleção múltipla funcional
Pesquisa por Nome | ● Campo de pesquisa para filtrar orçamentos por nome. <br> ● Busca em tempo real por correspondência exata. <br> ● Apenas orçamentos com o nome pesquisado são exibidos. <br> ● Limpar pesquisa restaura listagem completa. | ● Pesquisa em tempo real funcional <br> ● Filtro por nome exato <br> ● Resultados precisos <br> ● Limpar restaura lista | ● Busca eficiente e precisa
Exportação de Dados | ● Botão "Exportar" habilitado apenas com itens selecionados. <br> ● Modal de exportação com campo de nome do arquivo. <br> ● Opções de formato: PDF e CSV. <br> ● Ao confirmar, gerar arquivo para download. <br> ● Modal fecha após exportação. | ● Botão desabilitado sem seleção <br> ● Modal de exportação funcional <br> ● Nome de arquivo editável <br> ● PDF e CSV disponíveis <br> ● Download gerado | ● Exportação funcional nos 2 formatos


## 4 - Estratégia de Teste

● Escopo de Testes

O plano de testes abrange todas as funcionalidades descritas na tabela acima, incluindo componentes, orçamentos, autenticação, cadastros auxiliares (categorias, localizações, fornecedores) e relatórios.

Serão executados testes em todos os níveis conforme a descrição abaixo.

Testes Unitários: o código terá uma cobertura de 60% de testes unitários, que são de responsabilidade dos desenvolvedores.

Testes de Integração: Serão executados testes de integração em todos os endpoints, e esses testes serão de responsabilidade do time de qualidade.

Testes Manuais: Todas as funcionalidades serão testadas manualmente pelo time de qualidade seguindo a documentação de Cenários de teste e deste TestPlan.

Versão Beta: Será lançada uma versão beta para 20 usuários pré-cadastrados antes do release.


● Ambiente e Ferramentas

Os testes serão feitos do ambiente de homologação, e contém as mesmas configurações do ambiente de produção com uma massa de dados gerada previamente pelo time de qualidade.

As seguintes ferramentas serão utilizadas no teste:

Ferramenta | Time | Descrição
-----------|------|----------
Cypress | Qualidade | Framework para testes end-to-end automatizados
Postman | Qualidade | Ferramenta para realização de testes de API
Jest | Desenvolvimento | Framework utilizada para testes unitários


## 5 - Classificação de Bugs

Os Bugs serão classificados com as seguintes severidades:

ID | Nivel de Severidade | Descrição
-----------|--------|--------
1 | Blocker | ● Bug que bloqueia o teste de uma função ou feature causa crash na aplicação. <br>● Botão não funciona impedindo o uso completo da funcionalidade. <br>● Bloqueia a entrega.
2 | Grave | ● Funcionalidade não funciona como o esperado <br>● Input incomum causa efeitos irreversíveis
3 | Moderada | ● Funcionalidade não atinge certos critérios de aceitação, mas sua funcionalidade em geral não é afetada <br>● Mensagem de erro ou sucesso não é exibida
4 | Pequena | ● Quase nenhum impacto na funcionalidade porém atrapalha a experiência <br>● Erro ortográfico <br>● Pequenos erros de UI


## 6 - Definição de Pronto

Será considerada pronta as funcionalidades que passarem pelas verificações e testes descritas neste TestPlan, não apresentarem bugs com a severidade acima de Minor, e passarem por uma validação de negócio de responsabilidade do time de produto.
