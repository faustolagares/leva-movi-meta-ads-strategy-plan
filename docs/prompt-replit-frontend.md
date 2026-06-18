# Prompt para o Replit — Frontend do App (Leva Movi)

> Cole este texto no Replit (Agent). Ajuste apenas a **lista de telas** na seção 5
> se quiser outro escopo. As demais seções já estão completas.

---

## Contexto

Quero que você construa o **frontend** de um aplicativo de mobilidade urbana
(pedir corridas — carro, moto e táxi), no estilo de um app de transporte por
aplicativo. Este é um trabalho **somente de frontend**: sem backend real, usando
dados de exemplo (mock) e serviços simulados. O app se chama **Leva Movi**.

## 1. Design (única instrução de design — siga à risca)

- Construa **inteiramente em cima do Base, o design system open-source da Uber**
  (Base Web / pacote `baseui` + `styletron`).
- Use **o mesmo estilo visual do app da Uber**. Componentes, tipografia,
  espaçamento, cores, sombras, botões, inputs, modais, listas e navegação devem
  vir do Base e seguir o visual do Uber.
- **Não invente design próprio.** Não crie um sistema de cores, tokens ou
  componentes visuais customizados. Se um componente existir no Base, use o do
  Base. Tema claro e escuro conforme o Base oferece.

## 2. Stack obrigatória

- **React + TypeScript**.
- **Base Web** (`baseui`) com **Styletron** (`styletron-engine-atomic` +
  `styletron-react`) como engine de estilo — é o padrão do Base.
- **Vite** como bundler.
- **react-i18next** + **i18next** para internacionalização.
- App **responsivo**, mobile-first (o foco é a experiência em celular), mas que
  também funcione bem no desktop.

## 3. Internacionalização (requisito central)

O app deve ser **trilíngue: Português (pt-BR), Inglês (en) e Espanhol (es)**.

- **Português (pt-BR) é o idioma padrão.**
- **Nenhum texto pode estar fixo (hard-coded) no código.** Todas as strings
  visíveis ficam em arquivos de tradução (`locales/pt-BR.json`, `locales/en.json`,
  `locales/es.json`), com as mesmas chaves nos três idiomas.
- Detecte o idioma do navegador no primeiro acesso; se não for um dos três, caia
  para pt-BR.
- Inclua um **seletor de idioma** visível na interface (ex.: no menu/perfil), que
  troca o idioma em tempo real e persiste a escolha (localStorage).
- Use **formatação sensível ao locale** (`Intl`) para datas, horas e distâncias.
  Mantenha os **preços em Real (BRL)** independentemente do idioma (a operação é
  no Brasil), apenas traduzindo os rótulos ao redor.
- Garanta que os três idiomas tenham **cobertura completa** — nenhuma chave
  faltando, nenhuma palavra em outro idioma vazando na tela.

## 4. Dados e comportamento

- Sem backend: use **dados mockados** em memória (motoristas próximos, categorias,
  preços, histórico, perfil) e **funções de serviço simuladas** (ex.: "pedir
  corrida" muda de estado após um timer).
- Estados de tela devem funcionar de ponta a ponta de forma simulada
  (selecionar destino → escolher categoria → confirmar → "motorista a caminho" →
  "em viagem" → "concluída" → avaliar).
- Deixe os pontos de integração isolados em uma camada de serviço, para depois
  trocar mock por API real sem mexer na UI.

## 5. Telas e funcionalidades (ajuste esta lista se quiser)

App do **passageiro**:

1. **Abertura / Autenticação** — login e cadastro (telefone/e-mail), simulados.
2. **Home com mapa** — mapa em tela cheia, campo "Para onde vamos?", localização
   atual, atalhos de endereços salvos (casa/trabalho).
3. **Definir destino** — busca de endereço com autocomplete (mock), origem e
   destino, até 4 paradas.
4. **Escolher corrida** — lista de categorias (Moto, Carro, Táxi) com preço
   estimado e tempo de chegada; seleção de forma de pagamento (Pix, dinheiro,
   cartão).
5. **Confirmação / Motorista a caminho** — dados do motorista e veículo, tempo de
   chegada, acompanhamento no mapa, cancelar.
6. **Em viagem** — rota no mapa, tempo estimado, compartilhar viagem.
7. **Fim da corrida** — resumo, pagamento, **avaliação** (estrelas + comentário).
8. **Histórico de corridas** — lista com detalhe de cada corrida.
9. **Perfil / Configurações** — dados do usuário, formas de pagamento, **seletor
   de idioma**, endereços salvos.

## 6. Estrutura e qualidade

- Organize por **componentes reutilizáveis** e telas; uma camada `services/` para
  os mocks; uma pasta `locales/` para as traduções.
- Roteamento entre as telas (ex.: `react-router`).
- Código **TypeScript tipado**, componentes funcionais com hooks.
- Acessibilidade básica (labels, foco, contraste herdado do Base).
- Inclua um **README** explicando como rodar (`npm install` / `npm run dev`) e
  como adicionar/editar traduções.

## 7. Critérios de aceite

- [ ] Tudo renderizado com componentes do **Base Web**, no estilo Uber — sem
      design customizado.
- [ ] App funciona em **pt-BR, en e es**, com seletor de idioma trocando tudo em
      tempo real e **zero texto fixo no código**.
- [ ] Os três arquivos de tradução têm **as mesmas chaves**, sem faltas.
- [ ] O fluxo completo de pedir corrida funciona de ponta a ponta com mocks.
- [ ] Layout responsivo, mobile-first.
- [ ] Roda com `npm install` + `npm run dev` sem erros.

## 8. Entregáveis

- Projeto React + TypeScript + Base Web rodando no Replit.
- Pasta `locales/` com `pt-BR.json`, `en.json`, `es.json` completos.
- README com instruções de execução e de tradução.
