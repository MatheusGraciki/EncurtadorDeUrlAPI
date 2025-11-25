# URL Shortener API

API serverless para encurtar URLs, desenvolvida com Express, TypeScript e Vercel. Utiliza Upstash Redis como banco de dados.

## 🚀 Acesso

**URL Base (Produção):**
```
https://graciki.systems
```

## 📚 Endpoints

### 1. Criar uma URL Curta (POST)

**Endpoint:**
```
POST /url/create
```

**Content-Type:** `application/json`

**Body:**
```json
{
  "shortUrl": "abc",
  "originalUrl": "https://www.exemplo-url-muito-longa.com/caminho/para/pagina?parametro=valor"
}
```

**Exemplo com cURL:**
```bash
curl -X POST https://graciki.systems/url/create \
  -H "Content-Type: application/json" \
  -d '{"shortUrl":"abc","originalUrl":"https://example.com"}'
```

**Exemplo com Postman/Insomnia:**
1. Método: `POST`
2. URL: `https://graciki.systems/url/create`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "shortUrl": "meu-link",
  "originalUrl": "https://www.google.com"
}
```

**Respostas:**

✅ **Sucesso (201 Created):**
```
Status: 201
Body: (vazio)
```

❌ **Erro - URL curta já em uso (400 Bad Request):**
```json
{
  "error": "Essa url encurtada já está em uso, escolha outra."
}
```

❌ **Erro - Dados inválidos (400 Bad Request):**
```json
{
  "error": "Mensagem de erro específica"
}
```

---

### 2. Acessar uma URL Curta (GET) — Redireciona

**Endpoint:**
```
GET /url/:shortUrl
```

**Parâmetros:**
- `:shortUrl` — o identificador único que você criou (ex: `abc`, `meu-link`)

**Exemplo com cURL:**
```bash
curl -i https://www.graciki.systems/url/abc
```

**Exemplo no Browser:**
Acesse diretamente:
```
https://www.graciki.systems/url/as
```
Você será **redirecionado automaticamente** para a URL original.

**Respostas:**

✅ **Sucesso - Redirect (302 Found):**
```
Status: 302
Location: https://example.com
```
(O browser redireciona automaticamente)

❌ **Erro - URL curta não encontrada (404 Not Found):**
```json
{
  "error": "Essa url encurtada não existe"
}
```

❌ **Erro - Falta parâmetro (400 Bad Request):**
```json
{
  "error": "shortUrl param is required"
}
```

---

## 💡 Exemplos de Uso Completo

### Exemplo 1: Criar e Acessar uma URL Curta

**Passo 1: Criar a URL curta**
```bash
curl -X POST https://www.graciki.systems/url/create \
  -H "Content-Type: application/json" \
  -d '{
    "shortUrl": "github",
    "originalUrl": "https://github.com/MatheusGraciki"
  }'
```

Resposta:
```
Status: 201 Created
```

**Passo 2: Acessar a URL curta**
```bash
curl -i https://www.graciki.systems/url/github
```

Resposta:
```
HTTP/2 302 Found
Location: https://github.com/MatheusGraciki
```

Ou no browser, acesse:
```
https://www.graciki.systems/url/github
```
E você será redirecionado para `https://github.com/MatheusGraciki`.

---

### Exemplo 2: Criar Múltiplas URLs

```bash
# URL 1
curl -X POST https://www.graciki.systems/url/create \
  -H "Content-Type: application/json" \
  -d '{"shortUrl":"youtube","originalUrl":"https://www.youtube.com"}'

# URL 2
curl -X POST https://www.graciki.systems/url/create \
  -H "Content-Type: application/json" \
  -d '{"shortUrl":"google","originalUrl":"https://www.google.com"}'

# URL 3
curl -X POST https://www.graciki.systems/url/create \
  -H "Content-Type: application/json" \
  -d '{"shortUrl":"dev","originalUrl":"https://developer.mozilla.org"}'
```

Depois acesse:
- https://www.graciki.systems/url/youtube
- https://www.graciki.systems/url/google
- https://www.graciki.systems/url/dev

---

## 🛠 Tecnologias

- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **Banco de Dados:** Upstash Redis
- **Deploy:** Vercel (Serverless Functions)
- **Dependências principais:**
  - `express` — Framework Web
  - `@upstash/redis` — Cliente Redis serverless
  - `serverless-http` — Adaptador para funções serverless
  - `dotenv` — Variáveis de ambiente

---

## 📦 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/MatheusGraciki/EncurtadorDeUrl.git
cd EncurtadorDeUrl/backend

# Instalar dependências
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
REDIS_URL=https://seu-upstash-endpoint.upstash.io
REDIS_TOKEN=seu-token-aqui
```

Obtenha as credenciais do Upstash Redis em: https://upstash.com

### Executar Localmente

**Modo desenvolvimento:**
```bash
npm run dev
```

Servidor iniciará em: `http://localhost:3000`

**Testar endpoints locais:**
```bash
# Criar URL
curl -X POST http://localhost:3000/url/create \
  -H "Content-Type: application/json" \
  -d '{"shortUrl":"teste","originalUrl":"https://example.com"}'

# Acessar URL
curl -i http://localhost:3000/url/teste
```

### Build

```bash
npm run build
```

Saída compilada em: `dist/`

### Iniciar Build Compilado

```bash
npm start
```

---

## 🔗 Integração com Domínio Personalizado

Para usar um domínio próprio (ex: `meudominio.com/url/abc`):

1. Registre um domínio (Namecheap, GoDaddy, Google Domains, etc.)
2. Acesse Vercel Dashboard → Seu Projeto → Settings → Domains
3. Adicione o domínio e siga as instruções de DNS
4. Após propagação DNS, seu encurtador funcionará em: `https://meudominio.com/url/abc`

---

## ⏰ Expiração de URLs

As URLs criadas expiram automaticamente após **30 dias** no Redis. Após esse período, ao tentar acessar uma URL expirada, você receberá erro 404.

---

## 🐛 Troubleshooting

### Erro: "Essa url encurtada já está em uso"
A chave já foi criada. Escolha outro `shortUrl`.

### Erro: "Essa url encurtada não existe"
A chave não existe no banco ou expirou. Crie uma nova URL.

### Erro: Conexão com Redis
Verifique se `REDIS_URL` e `REDIS_TOKEN` estão corretos no `.env` ou no Vercel (Production Environment Variables).

---

## 📝 Licença

Este projeto é open-source. Sinta-se livre para usar, modificar e distribuir.

---

## 👤 Autor

**Matheus Graciki**
- GitHub: [@MatheusGraciki](https://github.com/MatheusGraciki)

---

## 📧 Suporte

Para reportar bugs ou sugerir funcionalidades, abra uma issue no repositório GitHub.
