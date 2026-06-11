# Especificação de Segurança e LGPD

**Documento 4 de 4 da fundação. Versão 0.1 — para aprovação.**
Anteriores: PRD, Arquitetura Técnica, Multi-Tenancy (aprovados). Fecha a Fase 0.

---

## 1. Princípio

Segurança aqui não é camada, é propriedade do desenho. As decisões já tomadas nos documentos 2 e 3 (RLS forçado, wrapper único de banco e Redis, tenant fixado no binário, flags server-side) são a maior parte da superfície de segurança. Este documento completa o que falta: dados pessoais, pagamento, auditoria e resposta.

## 2. Threat model — os cinco adversários que importam

| # | Ameaça                                | Vetor típico                                                  | Defesa principal                                                                 |
| - | ------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1 | Vazamento entre tenants               | Bug de query, rota sem escopo                                 | RLS forçado + suite de isolamento no CI (doc 3)                                  |
| 2 | Abuso por usuário autenticado         | Motorista/passageiro manipulando API (preço, posição, status) | Autorização por papel + validação server-side de toda transição e valor          |
| 3 | Cliente adulterado                    | App modificado, replay de requisições, GPS spoofing           | Tenant no binário, tokens curtos, validação de plausibilidade de posição         |
| 4 | Comprometimento de credencial interna | Chave de API, secret vazado, acesso de suporte abusado        | Cofre de secrets, menor privilégio, auditoria append-only de acesso cross-tenant |
| 5 | Fraude financeira                     | Webhook forjado, corrida fantasma, manipulação de carteira    | Assinatura de webhook, idempotência, reconciliação, ledger imutável              |

Fora de escopo declarado: ataque de estado-nação, DDoS volumétrico além do que a plataforma de infra mitiga nativamente. Proporcionalidade é parte do desenho.

## 3. Autenticação e autorização

- **Better Auth** com sessões por papel: passageiro, motorista, entregador, operador, corporativo. Papel e `tenant_id` viajam na sessão; a API deriva ambos da sessão, **nunca** de parâmetro do cliente.
- **Autorização em duas chaves em toda rota:** papel permitido + escopo de tenant. Implementada como middleware tRPC único, não como verificação espalhada por handler.
- **Motorista tem estado de habilitação** (documentos aprovados, CNH válida, não bloqueado) verificado no aceite de corrida, não só no login.
- **Sockets:** token curto de uso único emitido pela API, expira em segundos, vincula socket a usuário+tenant+papel (doc 2).
- **Painel de plataforma (nós):** MFA obrigatório, acesso cross-tenant nomeado e auditado (doc 3, seção 5).
- Senhas com hash padrão do Better Auth (argon2/bcrypt); reset por canal verificado; rate limit em login e reset.

## 4. Inventário de dados pessoais e tratamento

| Dado                           | Titular                                        | Sensibilidade      | Tratamento                                                                                                              |
| ------------------------------ | ---------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Nome, telefone, e-mail         | Todos                                          | PII comum          | Criptografia em repouso (disco), acesso por papel                                                                      |
| CPF                            | Motorista (e passageiro se nota fiscal exigir) | PII alta           | Coletar só onde obrigatório; mascarado na UI; nunca em log                                                             |
| CNH (número, validade, imagem) | Motorista                                      | PII alta           | Imagem em storage privado com URL assinada e expiração; validade em tabela; imagem nunca em log ou cache de CDN público |
| Foto do passageiro            | Passageiro                                     | PII alta           | Mesma política de storage da CNH; exibida ao motorista só durante corrida ativa                                        |
| Posição em tempo real          | Motorista                                      | Altamente sensível | Vive no Redis com TTL; **não persistida fora de corrida ativa** (doc 2)                                                |
| Trilha de viagem               | Motorista + passageiro                         | Altamente sensível | Amostragem reduzida no PostGIS; retenção definida na seção 5                                                           |
| Dados de cartão                | Passageiro                                     | PCI                | **Nunca tocam nosso sistema.** Tokenização no gateway; guardamos só o token e os últimos 4 dígitos                     |
| Chat de corrida                | Passageiro + motorista                         | PII comum          | Escopado por corrida; retenção limitada (seção 5)                                                                      |

Regras transversais:

- **Logs nunca contêm PII.** Identificadores internos (UUIDs) apenas. Lint/review de log como prática.
- **Backups herdam a política:** expurgo definitivo inclui ciclo de backup.
- **Minimização:** o cadastro pede o mínimo que a operação exige. Campo "bom ter" não entra.

## 5. Retenção (política padrão, ajustável por contrato)

| Dado                              | Retenção                                                                | Justificativa                             |
| --------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| Posição fora de corrida           | 0 — não persiste                                                        | Minimização                               |
| Trilha de viagem                  | 90 dias online, depois agregada/anonimizada                             | Disputa de corrida, segurança             |
| Chat de corrida                   | 90 dias                                                                 | Disputa e suporte                         |
| Corridas (registro financeiro)    | 5 anos                                                                  | Obrigação fiscal/contratual               |
| Documentos de motorista desligado | Prazo contratual do operador, depois expurgo                            | LGPD art. 15/16                           |
| Auditoria de acesso               | 5 anos, append-only                                                     | Accountability                            |
| Conta encerrada pelo titular      | Anonimização do perfil; registros financeiros mantidos pelo prazo legal | Direito de eliminação vs. obrigação legal |

## 6. LGPD — papéis e bases

- **Arranjo:** o **operador é o controlador** dos dados de seus passageiros e motoristas; **nós somos o operador de dados (processor)** por conta dele. Isso espelha o modelo de negócio (o cliente é dele) e delimita responsabilidade. O contrato de licenciamento formaliza como acordo de tratamento de dados — documento 12, seu domínio direto.
- **Bases legais típicas:** execução de contrato (corrida, pagamento, cadastro), obrigação legal (registros fiscais), legítimo interesse (antifraude, segurança — com teste de balanceamento documentado). Consentimento só onde for de fato a base (marketing).
- **Direitos do titular:** o painel de gestão dá ao operador os mecanismos — exportar dados de um titular, anonimizar conta, atender eliminação — para que ele cumpra os prazos da LGPD sem nos acionar. Mecanismo nosso, obrigação dele.
- **Incidente de dados:** detecção → contenção → avaliação de risco ao titular → notificação ao operador afetado em até 24h com os fatos para que ele, controlador, avalie comunicação à ANPD e aos titulares. Runbook escrito antes do primeiro incidente, não durante.

## 7. Pagamento e dinheiro

- **PCI minimizado por arquitetura:** tokenização no Asaas, formulário de cartão do SDK do gateway, nosso escopo é SAQ-A.
- **Webhooks:** assinatura verificada, idempotência por chave de evento, fila de reprocessamento; reconciliação diária por job comparando nosso ledger com o gateway (doc 2, risco 2).
- **Carteira de créditos é ledger imutável:** apenas inserções (crédito/débito com referência à corrida ou recarga); saldo é derivado. Nunca update de saldo. É o que torna fraude detectável e disputa resolvível.
- **Valores são calculados e validados no servidor.** Preço, distância e tempo finais saem do nosso cálculo, nunca do cliente. Divergência grande entre estimativa e final gera flag de revisão.
- **Antifraude básico no MVP:** velocidade de posição implausível invalida trilha; corrida com origem=destino e duração mínima vira flag; recargas com cartão seguem o antifraude do gateway.

## 8. Segurança de aplicação e infraestrutura

- **Secrets** em cofre da plataforma de deploy (nunca em repo, nunca em build mobile); chaves do Google Maps com restrição por bundle ID/domínio e cotas.
- **Dependências:** lockfile, atualização de segurança automatizada (Dependabot/Renovate), build quebra em vulnerabilidade crítica conhecida.
- **TLS em tudo;** HSTS nos painéis; cookies de sessão `HttpOnly`/`Secure`/`SameSite`.
- **Rate limiting** por usuário e por IP nas rotas sensíveis (login, solicitação de corrida, recarga).
- **Mobile:** tokens em SecureStore/Keychain; certificate pinning avaliado na Fase 3 (custo de rotação vs. ganho); nenhuma chave secreta no binário — o app só carrega identificadores públicos e o tenant.
- **Ambientes isolados:** staging nunca acessa dados de produção; massa de teste sintética.

## 9. Auditoria

Tabela append-only de eventos sensíveis: login, mudança de tarifa, bloqueio/desbloqueio de motorista, acesso cross-tenant da plataforma, alteração de brand_config, operações de carteira manuais, exportação de dados. Quem, quando, o quê, de onde. Sem update nem delete. Cinco anos.

## 10. Critérios de aceite de segurança (entram no CI/checklist)

1. Suite de isolamento de tenant passando (doc 3) — bloqueia merge.
2. Tabela nova sem RLS — bloqueia merge.
3. Import de driver de banco/Redis fora dos wrappers — bloqueia merge (lint).
4. PII detectada em log em staging — incidente de build.
5. Rota tRPC sem middleware de papel+tenant — bloqueia merge (verificação estática).
6. Antes do piloto em produção: revisão de segurança completa desta spec contra o código, item a item.

---

**Fase 0 encerrada com este documento.** Fundação completa: PRD, Arquitetura, Multi-Tenancy, Segurança.

**Próximo passo recomendado:** iniciar a Fase 1 no Claude Code (esqueleto do Turborepo + design system tokenizado com o tema neutro light/dark), produzindo os documentos 5 (Design System) e 7 (Schema) junto com o código que eles especificam — a partir daqui, documento e implementação andam juntos.
