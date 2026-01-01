## 🧠 Backend & Arquitetura

O backend deste projeto foi desenvolvido com foco em simplicidade, baixo custo e escalabilidade, simulando um cenário real de produção.

A API é responsável por criar e resolver URLs encurtadas, seguindo um modelo stateless, onde todo o estado da aplicação fica fora do servidor. Isso facilita escalar, manter e evoluir o sistema sem dependência de instâncias específicas.


---

## 🔄 Como a API funciona

O cliente envia uma URL longa

A API valida os dados e gera um identificador curto

A relação entre URL curta → URL original é armazenada no Redis

Quando a URL curta é acessada:

A API consulta o Redis

Retorna um redirect HTTP 302 se existir

Retorna 404 se não existir ou tiver expirado



Simples, rápido e eficiente.


---

## ☁️ Infraestrutura & Deploy

A aplicação roda em Google Cloud Run, utilizando containers Docker.

Por que Cloud Run?

Escala automaticamente conforme o tráfego

Quando não há requisições, nenhuma instância fica ativa

Reduz custo sem abrir mão de performance


A aplicação é empacotada em um container Docker, garantindo consistência entre ambiente local e produção.


---

## 🔁 CI/CD

O deploy é totalmente automatizado usando GitHub Actions.

A cada push na branch master:

1. A imagem Docker é buildada


2. Publicada no Artifact Registry


3. Um novo deploy é feito automaticamente no Cloud Run



Isso elimina deploy manual e reduz risco de erro humano.


---

## 🗄️ Persistência com Redis

O armazenamento das URLs é feito com Upstash Redis (serverless).

Baixa latência

Modelo chave → valor ideal para esse caso

URLs possuem TTL de 30 dias, evitando crescimento infinito da base


Nenhum dado sensível fica no código — tudo é configurado via variáveis de ambiente.


---

## 🌐 Domínio Customizado

A API está disponível via domínio próprio:

https://graciki.systems

O domínio foi configurado via DNS e integrado ao Cloud Run, permitindo URLs curtas e profissionais sem depender da URL padrão do provedor.


---

## 📈 Escalabilidade & Custos

Escala automática conforme demanda

Sem tráfego = custo praticamente zero

Limites definidos para evitar gastos inesperados:

1 vCPU

256MB de memória

Máximo de 3 instâncias




---

## 🧩 Principais decisões técnicas

Cloud Run em vez de VM → menos manutenção

Backend stateless → fácil de escalar

Redis serverless → performance sem complexidade

CI/CD desde o início → fluxo profissional

Docker → previsibilidade no deploy

## 📝 Licença

Este projeto é open-source. Sinta-se livre para usar, modificar e distribuir.

---

## 👤 Autor

**Matheus Graciki**
- GitHub: [@MatheusGraciki](https://github.com/MatheusGraciki)

---

## 📧 Suporte

Para reportar bugs ou sugerir funcionalidades, abra uma issue no repositório GitHub.
