# Alerta Rua

O Alerta Rua é uma plataforma colaborativa para monitoramento e reporte de problemas urbanos relacionados à zeladoria pública. O objetivo principal do projeto é permitir que os cidadãos registrem ocorrências, como buracos em vias públicas, postes sem iluminação, acúmulo irregular de lixo e vazamentos de água. Essas informações são centralizadas e disponibilizadas em um mapa interativo, facilitando a visualização dos problemas tanto pela comunidade quanto pelos órgãos competentes.

## Funcionalidades Principais

- Mapa Interativo: Visualização de ocorrências cadastradas em tempo real utilizando a API do Google Maps.
- Reporte de Ocorrências: Formulário dedicado para descrição dos problemas, seleção do tipo de falha e indicação precisa da localização no mapa.
- Acompanhamento de Status: Ciclo de vida das ocorrências estruturado nos estados "Aberta", "Em Andamento" e "Resolvida", com indicadores visuais associados.
- Busca e Filtro: Mecanismo de busca para encontrar ocorrências pelo título ou endereço diretamente na barra lateral.

## Tecnologias Utilizadas

- Frontend: Vue.js 3 e React.
- Construção e Empacotamento: Vite.
- Estilização: Tailwind CSS.
- Mapas: Google Maps JavaScript API.
- Banco de Dados e Backend: Firebase Firestore e Express.
- Ícones: Lucide.
- Containerização: Docker e Docker Compose.

## Como Executar o Projeto Localmente

O projeto está estruturado com Docker, simplificando a configuração do ambiente de desenvolvimento. Também é possível rodá-lo utilizando os scripts nativos do Node.js.

### Pré-requisitos

1. Node.js e npm (ou pnpm/yarn) instalados.
2. Docker e Docker Compose instalados no sistema (opcional, para execução em container).
3. Chave válida de API do Google Maps.

### Passos para Execução com Docker

1. Clone o repositório e navegue até o diretório do projeto.
2. Crie ou configure as variáveis de ambiente necessárias (como as chaves do Firebase e do Google Maps) no arquivo `.env`.
3. Execute o comando de inicialização dos containers:
   `docker-compose up -d --build`
4. A aplicação estará disponível na porta configurada.

### Passos para Execução Nativa

1. Instale as dependências executando o comando `npm install`.
2. Configure o arquivo `.env` com as chaves necessárias.
3. Inicie o servidor de desenvolvimento com `npm run dev`.

## Estrutura do Projeto

- `src/`: Contém o código fonte da aplicação (componentes, rotas e estilos).
- `Dockerfile` e `docker-compose.yml`: Arquivos de configuração para orquestração de containers.
- `firestore.rules`: Regras de segurança de acesso aos dados do Firebase Firestore.
- `server.ts` e `vite.config.ts`: Configurações de servidor e empacotamento.

## Contribuição

Contribuições são bem-vindas. Para contribuir, crie um fork deste repositório, implemente as melhorias em uma nova branch e envie um Pull Request detalhando as alterações.