# EncurtadorDeUrlAPI

API Node.js/TypeScript que cria identificadores de 12 caracteres, armazena a relação no Redis por 30 dias e responde com redirecionamento HTTP 302.

## Arquitetura

Em produção, a API roda em container na VPS KingHost. O Traefik recebe HTTPS em `shortener-teste.initit.tech`, encaminha para a porta interna 8080 e gerencia o certificado Let's Encrypt. A API participa das redes Docker `proxy` e `shortener_internal`; o Redis participa somente da rede interna, usa AOF e o volume persistente existente `shortener_redis_data`. A Cloudflare fornece DNS/proxy, não executa o backend.

O deploy publica uma imagem identificada pelo SHA do commit no GHCR e, por SSH, chama um script administrativo restrito. Esse script atualiza somente `api`, espera o healthcheck e restaura a imagem anterior se a nova não ficar saudável. Ele não recria Redis nem Traefik.

## API

- `POST /create` — corpo `{ "originalUrl": "https://example.com" }`; retorna `{ "data": { "shortUrl": "..." } }`.
- `GET /:shortUrl` — redireciona para a URL original ou retorna 404.
- `GET /health` — liveness da aplicação.
- `GET /ready` — readiness, incluindo `PING` no Redis.
- `GET /testCiCD` — endpoint legado preservado.

Somente URLs HTTP/HTTPS com até 2048 caracteres são aceitas. A criação usa `SET key value EX 2592000 NX`, evitando a corrida entre verificar e gravar uma chave.

## Ambiente local

Requisitos: Node.js 24 LTS, npm e Redis.

```bash
cp .env.example .env
npm ci
npm run dev
```

Variáveis:

- `REDIS_URL` (obrigatória): URL `redis://` ou `rediss://`, incluindo senha quando configurada. Exemplo local: `redis://:senha@127.0.0.1:6379/0`.
- `PORT` (opcional): porta HTTP, padrão `8080`.

Não versione `.env`, `.env.api`, `secrets/redis.conf`, chaves ou tokens. Se a senha contiver caracteres reservados de URL, aplique percent-encoding.

Comandos de validação:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

## Imagem Docker

```bash
docker build -t encurtador-api:test .
docker run --rm --env-file .env -p 8080:8080 encurtador-api:test
```

A imagem usa Node.js 24 Alpine, build multi-stage, dependências travadas com `npm ci`, somente dependências de produção no runtime e o usuário não root `node`.

## Preparação da KingHost

Os comandos abaixo são administrativos e devem ser revisados na VPS. Não execute `docker compose up redis` antes de confirmar o nome do volume existente, a senha e a configuração atual do Redis.

1. Em `/opt/apps/shortener`, instale `compose.yml`. O diretório e o arquivo devem pertencer a `root` e não podem ser graváveis por grupo/outros. Preserve o `.env.api` existente e confirme que contém `REDIS_URL=redis://:SENHA@redis:6379/0`, pertencente a `root:root` e com permissão `0600`.
2. Confirme que o volume existente se chama `shortener_redis_data` com `sudo docker volume inspect shortener_redis_data`. O Compose declara esse volume como externo e não o cria nem apaga. Em `/opt/apps/shortener/.env`, mantenha apenas a referência inicial da imagem:

   ```dotenv
   API_IMAGE=ghcr.io/matheusgraciki/encurtadordeurlapi:SHA_DE_40_CARACTERES
   ```

3. Preserve o arquivo já testado `/opt/apps/shortener/secrets/redis.conf`, que contém a configuração de AOF e `requirepass`. Ele é montado como somente leitura em `/usr/local/etc/redis/redis.conf`. Mantenha-o fora do Git e preserve as permissões que já permitem ao processo Redis lê-lo; não copie sua senha para outro arquivo.
4. Confirme as redes existentes com `sudo docker network inspect proxy` e `sudo docker network inspect shortener_internal`. O Redis deve participar de `shortener_internal` com o alias DNS `redis`; sem isso, `REDIS_URL` não resolverá. API e Redis não têm `ports`.
5. Faça login no GHCR uma única vez para a conta root que executará o script. Para pacote privado, use um PAT clássico com apenas `read:packages` via `docker login --password-stdin`; não coloque o token na linha de comando nem em arquivo do projeto.

### Usuário e script de deploy

Crie um usuário dedicado sem acesso administrativo amplo. Não o adicione ao grupo `docker`: esse grupo equivale, na prática, a acesso root.

Como administrador, copie `deploy/deploy-shortener-api` para `/usr/local/sbin/deploy-shortener-api`, pertencente a `root:root`, modo `0755`. Depois crie `/etc/sudoers.d/shortener-deploy`:

```sudoers
deploy ALL=(root) NOPASSWD: /usr/local/sbin/deploy-shortener-api *
```

Use `visudo -cf /etc/sudoers.d/shortener-deploy` e modo `0440`. A regra dá acesso somente ao script; o próprio script aceita apenas `rollback` ou a imagem exata `ghcr.io/matheusgraciki/encurtadordeurlapi:<SHA hexadecimal de 40 caracteres>`. A chave pública do GitHub Actions deve ficar no `authorized_keys` desse usuário. Uma chave exclusiva por ambiente é preferível.

Antes do primeiro CI, o administrador deve iniciar a imagem conhecida usando o script. O pipeline nunca executa `docker compose up` para Redis ou Traefik.

## GitHub Actions e GHCR

O workflow `.github/workflows/deploy-kinghost.yml` roda em pushes para `master`:

1. executa lint, `npm audit` (falha em high/critical), testes e build TypeScript;
2. executa Gitleaks e CodeQL;
3. constrói e publica no GHCR com tag igual ao SHA completo;
4. conecta por SSH e chama o script restrito;
5. aguarda o healthcheck e registra a imagem no resumo da execução.

CodeQL reduz risco, mas não prova ausência de vulnerabilidades. Gitleaks, audit ou qualquer validação com falha bloqueiam publicação/deploy.

Permissões do workflow: `contents:read` por padrão de job, `security-events:write` somente no CodeQL e `packages:write` somente na publicação. O `GITHUB_TOKEN` autentica no GHCR.

Crie o environment protegido `production` e estes secrets:

- `KINGHOST_SSH_HOST`
- `KINGHOST_SSH_USER` (o usuário dedicado, não `root`)
- `KINGHOST_SSH_PRIVATE_KEY`
- `KINGHOST_SSH_KNOWN_HOSTS` (linha verificada da host key; não use `StrictHostKeyChecking=no`)

Configure o pacote GHCR para permitir leitura pela VPS. O workflow usa controle de concorrência e não cancela um deploy de produção em andamento.

## Deploy, rollback e operação

Deploy normal: push em `master`. Para rollback manual, um administrador ou o usuário de deploy autorizado executa:

```bash
sudo /usr/local/sbin/deploy-shortener-api rollback
```

O script guarda a imagem anterior em `/opt/apps/shortener/.deploy-state`. Também faz rollback automático se o novo container não ficar saudável em 60 segundos. As tags SHA são imutáveis por convenção; para proteção mais forte, configure o GHCR contra sobrescrita ou evolua o pipeline para deploy por digest.

Comandos de diagnóstico na VPS:

```bash
cd /opt/apps/shortener
sudo docker compose ps
sudo docker compose logs --tail=200 api
sudo docker compose logs --tail=200 redis
sudo docker inspect --format '{{json .State.Health}}' shortener-api
curl --fail --silent --show-error https://shortener-teste.initit.tech/ready
```

Não registre `REDIS_URL`, conteúdo dos arquivos `.env` ou tokens ao coletar evidências. Configure a Cloudflare com SSL/TLS `Full (strict)` para validar o certificado de origem servido pelo Traefik.

## Decisões de migração

Upstash, Cloud Run, Artifact Registry, credenciais GCP e notificações Discord foram removidos. Os arquivos Vercel existentes executavam somente este backend; como não há frontend no repositório e o backend agora reside na KingHost, essa integração também foi removida. Dados antigos da GCP não são migrados.

## Licença

ISC. Autor: [Matheus Graciki](https://github.com/MatheusGraciki).
