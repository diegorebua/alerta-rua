# Ambiente local com 1Password

[Índice](index.md)

O comando `npm run dev` usa [scripts/with-onepassword.mjs](../scripts/with-onepassword.mjs) e o perfil [.1password/development.env](../.1password/development.env). O perfil contém somente referências aos campos do cofre, sem valores secretos.

## Preparar a autenticação

Use Node.js 22.12 ou superior e instale o [CLI oficial](https://developer.1password.com/docs/cli/get-started/) no sistema em que executa Node.js.

No WSL, instale também o CLI no Windows e habilite **Configurações → Desenvolvedor → Integrar com o CLI** no aplicativo 1Password. O runner busca os campos pelo `op.exe`, com autorização do Windows Hello, e passa os valores em memória ao CLI Linux, que inicia a aplicação. Não cria arquivos temporários com segredos nem executa o aplicativo no Windows. A detecção procura o CLI no PATH e na instalação padrão do WinGet. Para outra instalação, defina `OP_WINDOWS_CLI` com o caminho Linux do `op.exe`. `OP_LINUX_CLI` permite escolher o binário nativo.

Fora do WSL, o runner usa diretamente `op run --env-file=...`. Autentique o CLI nativo pelo aplicativo ou, no seu próprio terminal, execute `op account add` e `eval "$(op signin)"`. No WSL, `ONEPASSWORD_AUTH=native npm run dev` seleciona esse modo. Nunca envie senha, Secret Key ou token ao chat nem os registre em arquivos do projeto.

## Executar

```bash
npm run dev
# Outro comando local, com o mesmo ambiente:
npm run env:1password -- npm run build
```

Quando `ONEPASSWORD_ACTIVE=1`, o servidor e o Vite usam o ambiente recebido e ignoram os arquivos `.env` locais. As portas existentes são preservadas. Os comandos de publicação não foram alterados.

## Docker Compose com o cofre

No Linux/WSL, use os mesmos CLIs do host e Docker com Compose disponível:

```bash
npm run compose -- config --quiet
npm run compose -- up --build -d
npm run compose -- ps
npm run compose -- stop
```

O comando carrega o perfil `development.env` pelo 1Password e executa `docker compose --env-file /dev/null`. O Compose recebe a chave de mapas pelo ambiente do processo, sem ler `.env`, sem `env_file` e sem criar arquivos intermediários com segredos. As variáveis são passadas somente ao serviço `app`. A aplicação fica em `http://localhost:3200`, mapeada para a porta interna 3000, evitando conflito com o Nozzle. O plugin Cloudflare recebe `CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false` para não carregar `.env` pelo volume do checkout.

O container usa Node.js 22 e o pacote de certificados CA exigido pelo runtime Cloudflare, instala as dependências pelo lockfile com `npm ci` e inicia o servidor diretamente com `tsx`; não precisa de CLI, conta ou Windows Hello dentro da imagem. [.dockerignore](../.dockerignore) exclui arquivos de ambiente e dependências locais do contexto de build. A chave de mapas continua pública no navegador.

Após atualizar dependências, use `npm run compose -- up --build -d --renew-anon-volumes` para renovar o volume anônimo de `node_modules`. Wrangler e o plugin Cloudflare precisam fornecer um runtime que suporte a `compatibility_date` já definida em `wrangler.jsonc`; um runtime antigo interrompe a inicialização do Vite antes de o servidor HTTP ficar disponível.

Ao alterar o cofre, execute novamente `npm run compose -- up -d --force-recreate app`; `restart` não busca novos valores. Os arquivos locais originais foram preservados, mas não são fonte do Compose. Evite `config` sem `--quiet`, pois ele imprime os valores resolvidos.

No Docker Desktop, habilite a integração com sua distribuição em **Settings → Resources → WSL Integration**. `config --quiet` valida os arquivos sem subir serviços; iniciar containers exige o daemon ativo. `npm run test:compose` testa o mapeamento com dados de teste quando o CLI do Compose está disponível. `COMPOSE_TEST_CLI` permite selecionar um executável standalone para esses testes.

## Atualizar valores

Edite os campos da seção **Variáveis de ambiente** no item indicado pelo perfil e reinicie o processo. O campo `arquivo_env` guarda o backup original e não é sincronizado com esses campos. Não renomeie nem apague os campos referenciados. Se faltar um campo ou a autenticação falhar, a inicialização para; não há fallback silencioso para o `.env`.

A chave pública de mapas continua sendo entregue ao navegador, conforme o comportamento existente. Guardá-la no 1Password não a torna secreta no frontend.

`npm run test:env` testa o runner com fixtures, sem acessar o cofre ou serviços externos.

`npm run lint` executa `vue-tsc --noEmit`. As declarações do Vite ficam em `src/vite-env.d.ts`; o carregador de mapas usa a opção `v` da versão instalada de `@googlemaps/js-api-loader`.
