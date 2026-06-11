# Arquitetura Técnica — Plataforma Licenciadora de Mobilidade

**Documento 2 de 4 da fundação. Versão 0.1 — para aprovação.**
Anterior: PRD (aprovado). Próximos: Multi-Tenancy e White-Label → Segurança e LGPD.

---

## 1. Princípios arquiteturais

1. **Monolito modular, não microsserviços.** Um deploy de backend com módulos de domínio rigidamente separados. Microsserviço prematuro multiplica custo operacional sem ganho. A única exceção planejada é o gateway de tempo real, que escala separado.
2. **Um motor, N verticais.** Carro, mototáxi, táxi e entrega rodam sobre o mesmo núcleo de dispatch. Vertical é configuração de categoria, não código duplicado.
3. **Tenant em tudo.** Toda linha de dado, toda conexão WebSocket, todo job carrega `tenant_id`. Detalhado no documento 3.
4. **Configuração é dado.** Tarifa, categoria, toggle e branding vivem em tabela, geridos pelo painel. Mudança de regra de negócio do operador nunca exige deploy.
5. **O que é vivo fica no Redis; o que é histórico fica no Postgres.** Posição de motorista em tempo real não é registro, é estado volátil.

## 2. Visão macro

```
┌────────────────────────────────────────────────────────────┐
│ SUPERFÍCIES                                                  │
│ App Passageiro │ App Motorista │ App Entregador              │
│ (Expo/RN, binário por marca via App Factory)                 │
│ Painel de Gestão │ Painel de Empresas (TanStack Start)       │
└──────────────┬─────────────────────────────┬───────────────┘
               │ HTTPS (tRPC/REST)            │ WSS
       ┌───────▼────────┐            ┌────────▼─────────┐
       │  API (monolito  │            │  Realtime Gateway │
       │  modular Node)  │◄──Redis───►│  (WebSocket)      │
       └───────┬────────┘   pub/sub  └────────┬─────────┘
               │                               │
   ┌───────────▼───────────────────────────────▼───────────┐
   │ MÓDULOS DE DOMÍNIO (packages no monorepo)               │
   │ identity │ tenant │ catalog │ trip │ dispatch │          │
   │ location │ wallet │ payments │ ratings │ chat │           │
   │ compliance │ corporate │ notifications │ analytics        │
   └───────┬──────────────┬─────────────────┬───────────────┘
           │              │                 │
     ┌─────▼─────┐  ┌─────▼─────┐    ┌──────▼──────┐
     │ PostgreSQL │  │   Redis    │    │ Job runner   │
     │ + PostGIS  │  │ GEO/pub-sub│    │ (BullMQ)     │
     │ + RLS      │  │ /streams   │    │              │
     └────────────┘  └────────────┘    └──────────────┘
           │
   ┌───────▼──────────────────────────────────────────────┐
   │ EXTERNOS: Google Maps Platform │ Asaas │ FCM/APNs      │
   │ (futuro: OSRM, Mercado Pago, seguradora, iFood)        │
   └────────────────────────────────────────────────────────┘
```

## 3. Decisões de stack (fechando as análises)

### 3.1 Painéis web: TanStack Start

Decidido por consistência com o padrão que você já opera no NEXLINK OS (TanStack Start + tRPC + Drizzle). Reuso de conhecimento, de padrões de código e de componentes. Next.js fica descartado para este projeto.

### 3.2 Mapas: Google Maps Platform no início, gatilho de migração definido

- **Por quê:** cobertura e qualidade de geocoding no interior do Brasil. Em cidade pequena de Goiás, endereço impreciso é a regra; o Places/Geocoding do Google é o que melhor resolve. Mapbox e OSRM perdem exatamente onde o piloto vive.
- **Uso:** Places (autocomplete), Geocoding, Directions/Routes (ETA e traçado), tiles via react-native-maps com provider Google.
- **Controle de custo:** cache de geocoding por endereço normalizado, cache de rotas frequentes, session tokens no autocomplete, ETA recalculada por intervalo e não por tick.
- **Gatilho de migração:** quando o custo mensal de Directions ultrapassar o custo de operar OSRM self-hosted (servidor + manutenção), roteirização migra para OSRM com dados OpenStreetMap. A interface de roteirização nasce abstraída (`RoutingProvider`) para essa troca custar dias, não meses.

### 3.3 Gateway de pagamento: Asaas como primeira implementação

- **Por quê:** o Asaas tem subcontas white-label e split nativo, que mapeiam exatamente no nosso modelo — cada operador vira uma subconta, o split corrida-a-corrida divide entre operador e plataforma sem fluxo de caixa passando indevidamente por nós. Pix e cartão tokenizado nativos. Você já conhece a plataforma do Billing Hub da NexLink.
- **Arquitetura:** interface `PaymentProvider` no módulo payments. Asaas é o primeiro adapter; Mercado Pago é o segundo planejado (relevante se algum operador exigir). Nenhum código de domínio conhece o gateway concreto.
- **Validação:** um spike técnico na Fase 2 confirma limites de subconta e latência de webhook antes de fechar definitivo. Se o spike reprovar, Mercado Pago assume com marketplace/split deles.

### 3.4 Tempo real: gateway WebSocket dedicado

- Serviço Node separado do monolito, stateless, escalável horizontalmente.
- Autenticação do socket por token curto emitido pela API; conexão escopada por `tenant_id` e papel.
- Redis pub/sub distribui eventos entre instâncias (oferta de corrida, posição, chat, mudança de status).
- Cliente mobile com reconexão e fila local; push (FCM/APNs via Expo) cobre o app em background.

### 3.5 Localização

- Motorista online transmite posição a cada 3–5s pelo socket.
- Estado vivo: `GEOADD` no Redis por tenant+cidade+categoria. TTL agressivo; motorista que para de transmitir sai do matching.
- Histórico: amostragem reduzida persistida no Postgres/PostGIS apenas durante corrida ativa (trilha da viagem), com política de retenção definida no documento 4. Fora de corrida, o rastro não é persistido.
- Background location no app motorista via Expo (dev build, não Expo Go) com task de background; este é um dos pontos que exigem binário de desenvolvimento desde a Fase 1.

### 3.6 Filas e jobs: BullMQ sobre Redis

- Despacho com timeout, expansão de raio, verificação diária de CNH, fechamento de faturas corporativas, reconciliação de webhooks de pagamento.
- Kafka/RabbitMQ ficam explicitamente fora até existir volume que os justifique.

### 3.7 Banco

- PostgreSQL gerenciado com PostGIS habilitado. RLS ativo desde a primeira migração (mecânica no documento 3).
- Drizzle como ORM e dono das migrações.
- Zonas de cobertura por cidade como polígonos PostGIS; validação de origem/destino dentro da zona do tenant.

### 3.8 Infraestrutura (resumo; plano completo no documento 10)

- Contêineres em plataforma gerenciada (Railway ou Fly.io) para API, Realtime Gateway e workers; três serviços, um repositório.
- Postgres e Redis gerenciados na mesma região (São Paulo) — latência de matching manda.
- Ambientes: `dev`, `staging` (com os dois tenants de teste), `prod`.
- EAS (Expo Application Services) para builds mobile e a App Factory.

## 4. Módulos de domínio

| Módulo        | Responsabilidade                                                                        |
| ------------- | --------------------------------------------------------------------------------------- |
| identity      | Better Auth, papéis (passageiro, motorista, entregador, operador, corporativo), sessões |
| tenant        | Operadores, cidades, toggles de vertical e feature flags, branding config               |
| catalog       | Categorias, tarifas, regras de preço por categoria e forma de pagamento, surge config   |
| trip          | Máquina de estados da corrida/entrega, multidestino, cancelamentos                      |
| dispatch      | Matching geoespacial, oferta sequencial com timeout, expansão de raio, surge automático |
| location      | Ingestão de posição, estado vivo no Redis, trilha de viagem no PostGIS                  |
| wallet        | Carteira de créditos do motorista, recargas, débito por corrida                         |
| payments      | Interface PaymentProvider, adapter Asaas, split, webhooks, reconciliação                |
| ratings       | Avaliações pós-corrida, médias por motorista                                            |
| chat          | Mensagens passageiro↔motorista e operador↔motorista, escopadas por corrida              |
| compliance    | Validade de CNH, documentos do motorista, bloqueios automáticos                         |
| corporate     | Painel de empresas, centro de custo, fatura mensal                                      |
| notifications | Push, templates por evento, preferências                                                |
| analytics     | Indicadores do painel, agregações por tenant                                            |

Regra de fronteira: módulo não importa módulo diretamente; comunicação por contratos no package compartilhado ou por eventos. É o que mantém o monolito modular de verdade e permite extrair um módulo para serviço no futuro sem cirurgia.

## 5. Máquina de estados da corrida

```
REQUESTED → SEARCHING → ACCEPTED → ARRIVING → ARRIVED
          → IN_PROGRESS → COMPLETED → RATED

Ramos: CANCELLED_BY_PASSENGER | CANCELLED_BY_DRIVER
       | CANCELLED_BY_SYSTEM | NO_DRIVERS
```

- Transições válidas são whitelist no módulo trip; transição inválida é erro, nunca corrigida silenciosamente.
- Cada transição emite evento (Redis) consumido por realtime, notifications, payments e analytics.
- Entrega usa a mesma máquina com estados de coleta no lugar de embarque (`PICKUP_ARRIVED`, `PICKED_UP`).

## 6. Dispatch (resumo; design completo no documento 8)

1. Corrida entra em `SEARCHING`; dispatch consulta Redis GEO por motoristas online da categoria no raio inicial.
2. Ranking por ETA real (RoutingProvider), taxa de aceite e rodízio de justiça.
3. Oferta sequencial: um motorista por vez, timeout de ~15s, próximo da fila em recusa ou silêncio.
4. Raio expande em passos configuráveis por tenant; esgotado, `NO_DRIVERS`.
5. Surge: job monitora razão demanda/oferta por célula geohash por tenant+cidade; multiplica tarifa da célula conforme config do operador.

Parâmetros (raio inicial, passos, timeout, limites de surge) são configuração por tenant no catalog — nunca constantes no código.

## 7. Monorepo

```
apps/
  passenger/        # Expo
  driver/           # Expo (inclui modo entregador por flag de build)
  panel-operator/   # TanStack Start
  panel-business/   # TanStack Start
  api/              # monolito modular
  realtime/         # gateway WebSocket
packages/
  domain/           # módulos de domínio (seção 4)
  db/               # schema Drizzle + migrações + RLS
  contracts/        # tipos e routers tRPC compartilhados
  design-system/    # tokens + componentes (documento 5)
  brand-config/     # configs de marca por tenant (alimenta App Factory)
  routing/          # RoutingProvider (Google adapter, futuro OSRM)
  payments-core/    # PaymentProvider (Asaas adapter, futuro MP)
tooling/
  app-factory/      # pipeline EAS por marca (documento 6)
```

Decisão deliberada: App Motorista e App Entregador são um único app Expo com o fluxo de entrega habilitado por configuração de build/tenant. O esqueleto é idêntico; dois apps separados dobrariam manutenção sem ganho. Nas lojas, cada marca publica conforme as verticais que ativou.

## 8. Riscos técnicos específicos desta arquitetura

1. **Background location no iOS.** Restrições do iOS a tracking contínuo exigem configuração precisa de background modes e justificativa na review. Mitigação: padrão consolidado de apps de mobilidade (location updates só com corrida ativa ou motorista online), testado cedo na Fase 1 com dev build.
2. **Webhook de pagamento como fonte de verdade.** Pix e cartão confirmam por webhook; perda de webhook não pode perder dinheiro. Mitigação: reconciliação periódica por job (BullMQ) consultando o gateway, idempotência por chave de evento.
3. **Redis como ponto único do matching.** Mitigação: Redis gerenciado com replica, e degradação definida (sem Redis, dispatch pausa e enfileira; nunca corrompe estado no Postgres).
4. **Acoplamento acidental entre módulos.** Mitigação: regra de import enforced por lint no CI; violação quebra o build.

---

**Aprovação:** com o OK, o próximo é a Especificação de Multi-Tenancy e White-Label — a mecânica exata do RLS, o modelo de tenant/cidade/branding e os feature flags por operador.
