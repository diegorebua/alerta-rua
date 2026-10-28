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

Quando `ONEPASSWORD_ACTIVE=1`, o servidor e o Vite usam o ambiente recebido e ignoram os arquivos `.env` locais. As portas existentes são preservadas. Os comandos de produção e publicação não foram alterados. O Docker Compose continua usando o arquivo local; o runner não configura containers automaticamente.

## Atualizar valores

Edite os campos da seção **Variáveis de ambiente** no item indicado pelo perfil e reinicie o processo. O campo `arquivo_env` guarda o backup original e não é sincronizado com esses campos. Não renomeie nem apague os campos referenciados. Se faltar um campo ou a autenticação falhar, a inicialização para; não há fallback silencioso para o `.env`.

A chave pública de mapas continua sendo entregue ao navegador, conforme o comportamento existente. Guardá-la no 1Password não a torna secreta no frontend.

`npm run test:env` testa o runner com fixtures, sem acessar o cofre ou serviços externos.

`npm run lint` executa `vue-tsc --noEmit`. As declarações do Vite ficam em `src/vite-env.d.ts`; o carregador de mapas usa a opção `v` da versão instalada de `@googlemaps/js-api-loader`.
