# Especificação de Multi-Tenancy e White-Label

**Documento 3 de 4 da fundação. Versão 0.1 — para aprovação.**
Anteriores: PRD, Arquitetura Técnica (aprovados). Próximo: Segurança e LGPD.

---

## 1. O que este documento garante

Duas garantias que sustentam o negócio inteiro:

1. **Isolamento:** nenhum dado de um operador é legível, gravável ou inferível por outro operador, sob nenhuma falha de aplicação.
2. **White-label:** a identidade visual e as regras de cada operador são dados, e a plataforma se materializa como o app daquele operador sem nenhuma alteração de código.

## 2. Modelo de tenant

```
tenant (operador)
 ├── cities[]            # polígonos PostGIS, expansão sem deploy
 ├── verticals{}          # toggles: carro, mototáxi, táxi, entrega
 ├── feature_flags{}      # cashback, cupons, surge, corporativo...
 ├── brand_config         # cores, logos, nome, bundle IDs (seção 6)
 ├── categories[]         # por cidade ou globais ao tenant
 ├── tariffs[]            # por categoria + forma de pagamento
 └── billing               # plano, consumo mínimo, subconta Asaas
```

Regras do modelo:

- **Tenant é o operador**, não a cidade. Um operador com três cidades é um tenant com três polígonos. Categoria e tarifa podem variar por cidade dentro do tenant.
- **Vertical é toggle de tenant.** Ligar "entrega" não cria nada novo: habilita categorias do tipo entrega, o fluxo de coleta no app e as telas correspondentes no painel.
- **Usuário pertence a um tenant.** Passageiro, motorista e operador existem dentro de um tenant. Não há conta global de passageiro que atravessa operadores — o passageiro da Leva Movi é cliente da Leva Movi. Se a mesma pessoa usar apps de dois operadores, são duas contas. Simples, juridicamente limpo, e elimina uma classe inteira de vazamento.
- **Nós (licenciador) não somos um tenant.** Administração de plataforma é um plano de acesso separado (seção 5).

## 3. Mecânica do isolamento: RLS no PostgreSQL

### 3.1 Estrutura

- Toda tabela escopada por operador carrega `tenant_id UUID NOT NULL` com índice composto (`tenant_id`, chave de consulta).
- RLS habilitado e **forçado** (`FORCE ROW LEVEL SECURITY`) em todas essas tabelas, valendo inclusive para o dono da tabela.
- Política única por tabela: `USING (tenant_id = current_setting('app.tenant_id')::uuid)` e o equivalente em `WITH CHECK` para escrita.

### 3.2 Fluxo por requisição

1. Requisição chega com sessão autenticada (Better Auth). A sessão carrega `tenant_id` e papel.
2. A camada de banco abre transação e executa `SET LOCAL app.tenant_id = '<uuid>'` antes de qualquer query.
3. Toda query da transação enxerga apenas as linhas do tenant. Sem a variável setada, RLS nega tudo por padrão — falha fecha, nunca abre.

### 3.3 Regras inegociáveis

- A API conecta com role **sem** `BYPASSRLS` e que não é dona dos objetos. Não existe caminho de query da aplicação fora do RLS.
- `SET LOCAL` (escopo de transação), nunca `SET` (escopo de sessão), por causa de connection pooling — conexão devolvida ao pool não pode carregar tenant de requisição anterior. Pooler em modo transação.
- O wrapper de banco no package `db` é o único ponto que abre transação e seta a variável. Código de domínio não tem acesso a conexão crua. Lint no CI proíbe import direto do driver fora do package `db`.
- Defesa em profundidade: mesmo com RLS, as queries de domínio filtram por `tenant_id` explicitamente. RLS é a rede; o filtro é a prática. Os dois juntos é o padrão.

### 3.4 Redis e tempo real

RLS não cobre Redis. O isolamento lá é por convenção forçada de chave: todo key space prefixado `t:{tenant_id}:...`, e o wrapper de Redis no package compartilhado exige tenant explícito em toda operação — não existe método sem tenant. Socket autenticado carrega tenant; canal de pub/sub é por tenant. Mesma regra de lint: nenhum acesso a Redis cru fora do wrapper.

### 3.5 Prova contínua de isolamento

- **Dois tenants seed permanentes** (`tenant-qa-a`, `tenant-qa-b`) em todos os ambientes, incluindo produção desde o dia um (critério 4 do piloto no PRD).
- **Suite de isolamento no CI:** testes que autenticam como tenant A e tentam ler/escrever dados do tenant B por todas as rotas tRPC e por query direta. Qualquer sucesso quebra o build. A suite cresce junto com o schema: tabela nova sem política RLS quebra o build por verificação automática do catálogo do Postgres.

## 4. Feature flags e toggles

- Tabela `tenant_features` com chave, valor (boolean ou JSON de parâmetros) e tenant.
- **Avaliação é sempre server-side.** O cliente recebe o resultado via endpoint de config no boot; esconder botão no app é cortesia de UX, nunca a barreira. Toda rota de feature desligada responde negado no servidor.
- Verticais são flags de primeira classe (`vertical.car`, `vertical.moto`, `vertical.taxi`, `vertical.delivery`) e cascateiam: vertical desligada desabilita suas categorias, rotas e telas.
- Painel de gestão expõe os toggles que o plano do operador permite; o que o plano não cobre, nós controlamos no plano de plataforma.

## 5. Plano de acesso do licenciador

- Administração de plataforma (nós) vive em rotas e role de banco separados, com permissão de cruzar tenants **somente para operações de suporte nomeadas** (onboarding, billing, incidente).
- Todo acesso cross-tenant é auditado: quem, quando, qual tenant, qual operação, gravado em tabela append-only.
- Não existe "modo deus" na API de produto. O painel administrativo da plataforma é uma superfície própria (fase posterior; até lá, operações por script auditado).

## 6. Branding: a config de marca

Cada tenant tem um `brand_config` versionado:

```jsonc
{
  "brandId": "leva-movi",
  "displayName": "Leva Movi",
  "ios":     { "bundleId": "br.com.levamovi.passenger", "appName": "Leva Movi" },
  "android": { "applicationId": "br.com.levamovi.passenger" },
  "colors":  { "accent": "#0A84FF" },            // sobre o tema neutro light/dark
  "assets":  { "logo": "...", "icon": "...", "splash": "..." },
  "store":   { "appleTeamId": "...", "playAccount": "..." },  // contas do operador
  "support": { "email": "...", "whatsapp": "..." }
}
```

- **Painéis (web):** branding aplicado em runtime — o painel lê o tema do tenant logado.
- **Apps (mobile):** branding aplicado em **tempo de build**. Cada binário nasce com `brand_config` embutido: bundle ID próprio, ícone próprio, tenant fixado. O app da Leva Movi só fala com o tenant Leva Movi; não existe seletor de operador dentro do app. Isso fecha um vetor inteiro de ataque (cliente apontando para tenant alheio) e é o que a publicação por marca exige.
- A cor do operador entra como camada de acento sobre o tema neutro light/dark do design system (documento 5). O operador não escolhe cor de fundo nem tipografia — escolhe acento e assets. É o que mantém o rigor visual em N marcas.

## 7. Ciclo de vida do tenant

- **Onboarding:** criar tenant → cidades (polígonos) → verticais e flags → tarifas e categorias → subconta Asaas → brand_config → App Factory gera e publica os apps (documento 6). Meta do PRD: dias, não meses. O onboarding inteiro é executável pelo painel de plataforma sem deploy.
- **Suspensão:** por inadimplência ou quebra de contrato. Flag de tenant que corta dispatch e login de novas sessões, preservando dados. Reversível.
- **Offboarding:** exportação dos dados do operador (motoristas, corridas, clientes) em formato aberto, prazo de retenção contratual, depois expurgo definitivo com registro. O contrato de licenciamento (documento 12, seu domínio) define prazos; a plataforma só precisa ter o mecanismo pronto.

## 8. O que está explicitamente fora

- Schema-por-tenant e banco-por-tenant: descartados para este perfil de cliente. Se um dia um operador de grande porte exigir isolamento físico contratual, o desenho de módulos permite atender como exceção paga — não é o padrão.
- Conta de passageiro compartilhada entre operadores: descartada (seção 2).
- Branding mobile em runtime: descartado — conflita com publicação por marca e com a estratégia Apple 4.3.

---

**Aprovação:** com o OK, fecho a fundação com o documento 4 — Especificação de Segurança e LGPD, cobrindo threat model, PII, retenção de localização, pagamento e auditoria.
