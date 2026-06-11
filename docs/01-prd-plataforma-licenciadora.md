# PRD — Plataforma Licenciadora de Mobilidade e Entrega

**Documento 1 de 4 da fundação. Versão 0.1 — para aprovação.**
Próximos: Arquitetura Técnica → Multi-Tenancy e White-Label → Segurança e LGPD.

---

## 1. Tese

O produto não é um app de transporte. É uma plataforma de licenciamento de tecnologia.

Operadores regionais no Brasil querem ser donos do app de mobilidade da cidade deles. Não têm capacidade de construir tecnologia. O mercado já validou esse modelo: a Machine/Gaudium automatiza mais de 150 milhões de corridas por ano vendendo exatamente isso para dezenas de operadores. O valor está na plataforma multi-tenant, não em operar cidade.

Nós construímos a tecnologia uma vez e licenciamos N vezes. O operador fica com a marca, a operação local e o relacionamento com motoristas. Nós ficamos com a engenharia, a escala e a receita recorrente que cresce a cada cidade.

O cliente pagante é o operador. O passageiro é cliente do operador.

## 2. Decisões travadas

| Decisão                    | Valor                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Modelo de negócio          | Licenciador white-label B2B                                                                                |
| Verticais                  | Todas (carro, mototáxi, táxi, entrega expressa) com toggle por tenant                                      |
| Superfícies                | 5: App Passageiro, App Motorista, App Entregador, Painel de Gestão, Painel de Empresas                     |
| Pagamento                  | Dinheiro, Pix e cartão desde o MVP                                                                         |
| Piloto                     | Leva Movi (interior de Goiás)                                                                              |
| Publicação                 | Um app por marca, na conta de desenvolvedor do operador                                                    |
| Stack                      | Turborepo, React Native/Expo, Next.js ou TanStack, tRPC, Drizzle, PostgreSQL + PostGIS, Redis, Better Auth |
| Ferramenta de construção   | Claude Code, monorepo único                                                                                |
| Monetização do licenciador | Recomendação na seção 8                                                                                    |
| Marca da plataforma        | Decisão aberta, posição na seção 9                                                                         |

## 3. Atores

- **Licenciador (nós).** Dono da plataforma, da engenharia e do pipeline de publicação.
- **Operador (tenant).** Empreendedor local. Compra a licença, define tarifas e regras, recruta motoristas, é dono da marca e das contas de loja.
- **Motorista / Entregador.** Trabalha para o operador. Usa o app branded do operador.
- **Passageiro / Cliente final.** Usa o app branded do operador.
- **Empresa parceira.** Pessoa jurídica local que solicita corridas corporativas pelo Painel de Empresas.

## 4. Verticais como capacidade, não como produto separado

Cada vertical é um feature flag por tenant. O operador da cidade A liga carro e mototáxi. O da cidade B liga só entrega. O painel de gestão expõe os toggles; o backend trata vertical como configuração de categoria sobre o mesmo motor de dispatch.

Consequência de engenharia: existe um único motor de corrida/entrega. Carro, mototáxi, táxi e entrega são categorias com regras de matching, precificação e fluxo próprias rodando sobre o mesmo núcleo. Construir dois motores é o erro a evitar.

Ordem de construção (não de produto): o loop de mobilidade nasce primeiro e completo. O loop de entrega vem em seguida, reaproveitando dispatch, tracking, pagamento e carteira. Os toggles existem desde o primeiro dia.

## 5. Escopo funcional do MVP por superfície

### App Passageiro

- Cadastro e login
- Solicitação de corrida: origem, destino, multidestino (até 4 paradas)
- Escolha de categoria (conforme toggles do tenant)
- Estimativa de preço antes de pedir
- Tracking do motorista em tempo real
- Chat com motorista após o aceite
- Pagamento: dinheiro, Pix, cartão salvo (tokenizado via gateway)
- Compartilhar viagem
- Avaliação ao final
- Histórico de corridas

### App Motorista

- Cadastro com documentos (CNH, veículo) e aprovação pelo operador
- Online/offline
- Recebimento de oferta de corrida com timeout
- Navegação até embarque e destino
- Status da corrida (cheguei, iniciar, finalizar)
- Carteira de créditos pré-paga (modelo de cobrança do operador sobre o motorista)
- Extrato de ganhos por corrida
- Chat com passageiro e com o operador
- Bloqueio automático por CNH vencida

### App Entregador

- Mesmo esqueleto do app motorista, com fluxo de coleta e entrega (retirada no lojista, confirmação de entrega, foto/assinatura)

### Painel de Gestão (operador)

- Configuração de tarifas por categoria: base, por km, por minuto, taxa mínima
- Taxas diferenciadas por forma de pagamento
- Dinâmica/surge configurável
- Cadastro, aprovação e bloqueio de motoristas
- Toggles de vertical e de funcionalidades
- Gestão de cidades (expansão sem novo deploy)
- Cupons e desconto de primeira corrida
- Indicadores: corridas, faturamento, motoristas ativos, cancelamentos
- Gestão da carteira de créditos dos motoristas
- Branding: upload de logo, cores, nome (alimenta a App Factory)

### Painel de Empresas

- Solicitação de corrida para funcionários
- Centro de custo e fatura mensal
- Histórico e relatórios

### Fica fora do MVP (fase posterior)

Cashback de passageiro, gamificação/desafios de motorista, carteira de saldo do passageiro, categoria exclusiva para mulheres no matching, integração com seguradora, integrações iFood/ERP, API pública para terceiros, módulo restaurante.

## 6. Pagamentos

Todas as formas desde o MVP. Isso é a decisão de maior custo de engenharia do escopo e entra como núcleo, não como extra.

- **Dinheiro:** registrado no app, acertado entre motorista e operador via carteira de créditos.
- **Pix:** cobrança gerada no app, confirmação por webhook do gateway.
- **Cartão:** tokenização no gateway. Nenhum dado de cartão toca nosso banco.
- **Gateway abstraído:** interface única de pagamento no domínio; Mercado Pago ou Asaas como primeira implementação (análise definirá na Arquitetura). Split de pagamento entre operador e motorista quando o pagamento é in-app.

## 7. Piloto: Leva Movi

O piloto reposiciona a negociação. A proposta deixa de ser sociedade de 50% num app de uma cidade e passa a ser: Leva Movi como primeiro licenciado da plataforma, com condição de fundador (desconto vitalício ou período de carência) em troca de servir de campo de validação.

Critérios de sucesso do piloto:

1. Loop completo rodando em produção numa cidade: pedir → despachar → viagem → pagar → avaliar.
2. App da marca Leva Movi publicado nas lojas, na conta de desenvolvedor deles.
3. Operador gerindo tarifas, motoristas e toggles sozinho pelo painel, sem nos acionar.
4. 30 dias de operação real sem incidente de vazamento entre tenants (validado com um segundo tenant de teste ativo desde o início).

O quarto critério importa: o multi-tenancy só é validado com dois tenants no banco. Um tenant fake de QA roda em paralelo desde o primeiro dia.

## 8. Monetização do licenciador — recomendação

Recomendo o modelo híbrido em três componentes, validado pelo mercado (é o modelo da Machine) e alinhado aos incentivos:

1. **Taxa de adesão única.** Cobre a geração do app, o branding e o trabalho de publicação nas lojas. Publicar por marca é trabalho operacional real e recorrente em cada onboarding; a adesão financia isso e filtra curioso de comprador.
2. **Mensalidade com consumo mínimo.** Piso de receita previsível por operador. Protege o licenciador do operador que assina e não opera.
3. **Variável por corrida/entrega finalizada.** Acima do consumo mínimo, a receita escala com o sucesso do operador. Alinha o incentivo: nós ganhamos quando ele cresce.

Por que não as alternativas puras: percentual puro não tem piso e expõe a receita à sazonalidade de cidades pequenas; mensalidade fixa pura limita o upside e cobra caro demais de quem está começando. O híbrido resolve os dois lados.

Complemento obrigatório: as contas de loja (Apple Developer, Google Play) são do operador e pagas pelo operador. Isso é estratégia de publicação (risco Apple 4.3 distribuído), clareza jurídica de posse da marca e custo fora do nosso balanço.

Números (valor da adesão, piso, preço por corrida) ficam para o plano comercial, fora deste PRD. A estrutura é a decisão que o produto precisa agora.

## 9. Marca da plataforma — decisão aberta

Posição declarada: marca própria, separada da NexLink.

NexLink tem posicionamento construído em AI workforce e agentes. Uma plataforma de licenciamento de mobilidade vende para outro comprador, em outra categoria, com outro ciclo. Misturar dilui os dois posicionamentos. Marca separada protege a NexLink, dá à plataforma identidade vendável e preserva a opção de venda futura do ativo isolado.

Convenção de nome quando for decidir: uma palavra, peso mítico ou geométrico, pronúncia fácil nos dois mercados. Mesma régua de NexLink. A decisão não bloqueia nenhum documento técnico; no código, o produto usa um codinome neutro até a definição.

## 10. Roadmap faseado

- **Fase 0 — Fundação documental.** Este PRD + Arquitetura + Multi-Tenancy + Segurança aprovados.
- **Fase 1 — Esqueleto.** Turborepo, design system tokenizado, apps e painéis vazios compilando.
- **Fase 2 — Backend núcleo.** Auth multi-papel, modelo de tenant, schema com RLS, dois tenants de teste desde o início.
- **Fase 3 — Loop central de mobilidade.** Uma cidade, operador piloto, fluxo completo com as três formas de pagamento.
- **Fase 4 — App Factory.** Config de marca → binário branded → publicação na conta do operador. Validada com o app da Leva Movi.
- **Fase 5 — Vertical de entrega.** Loop de entrega sobre o mesmo motor. Toggles em produção.
- **Fase 6 — Camadas de retenção e expansão.** Cashback, gamificação, painel corporativo completo, integrações, API pública.

## 11. Métricas de sucesso da plataforma

- Corridas/entregas finalizadas por mês por tenant (a métrica que fatura)
- Tempo médio de matching e taxa de corridas sem motorista
- Taxa de cancelamento por etapa
- Tempo de onboarding de um novo operador (meta: dias, não meses)
- Tempo de publicação de um novo app branded
- Incidentes de isolamento entre tenants (meta: zero, sempre)

## 12. Riscos principais

1. **Apple 4.3(a).** White-label é alvo declarado de rejeição. Mitigação: publicação na conta do operador, diferenciação real de branding e metadados, checklist de submissão por marca, processo de apelação documentado. Tratar rejeição como rotina operacional, não como exceção.
2. **Custo de API de mapas.** O item de custo variável que mais cresce com volume. Mitigação: cache agressivo de rotas, análise Google vs Mapbox vs OSRM na Arquitetura, gatilho definido de migração para OSRM self-hosted.
3. **Escopo do MVP com 5 superfícies e 3 formas de pagamento.** É um MVP grande por decisão consciente. Mitigação: faseamento interno rígido (seções 4 e 10); nenhuma fase começa antes da anterior fechar.
4. **Vazamento entre tenants.** Falha catastrófica de reputação. Mitigação: RLS desde o schema, segundo tenant de QA permanente, teste de isolamento no CI.
5. **Dependência de um único piloto.** Se a negociação com a Leva Movi não fechar, o piloto não pode morrer junto. Mitigação: o tenant de QA mantém a plataforma validável; a tese de licenciador não depende de um operador específico.

---

**Aprovação:** com o OK neste documento, o próximo é o Documento de Arquitetura Técnica, que formaliza serviços, dispatch, tempo real, geoespacial e fecha as análises de gateway e mapas.
