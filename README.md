# 📍 Alerta Rua

**Alerta Rua** é uma plataforma colaborativa para monitoramento e reporte de problemas urbanos (zeladoria pública). O objetivo é permitir que cidadãos registrem ocorrências como buracos na via, postes sem luz, acúmulo de lixo e vazamentos, facilitando a visualização desses problemas em um mapa interativo para que a comunidade e os órgãos competentes possam agir.

---

## 🚀 Funcionalidades Principais

- **Mapa Interativo**: Visualização em tempo real de ocorrências próximas usando a API do Google Maps.
- **Reporte de Ocorrências**: Formulário completo para descrever problemas, selecionar o tipo de falha e indicar a localização.
- **Sistema de Status**: Acompanhamento do ciclo de vida das ocorrências (Aberta, Em Andamento, Resolvida) com indicadores visuais animados.
- **Busca Inteligente**: Filtre ocorrências por título ou endereço diretamente na barra lateral.


---

## 🛠️ Stack Tecnológica

- **Frontend**: [Vue.js 3](https://vuejs.org/) (Vite)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Mapas**: [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview) (Loader v3)
- **Backend/DB**: [Firebase Firestore](https://firebase.google.com/) (Suporte híbrido para dados reais e mockados)
- **Containerização**: [Docker](https://www.docker.com/) & Docker Compose
- **Ícones**: [Lucide Vue](https://lucide.dev/)

---

## 📦 Como Rodar o Projeto

O projeto está totalmente conteinerizado, o que facilita o setup inicial.

### Pré-requisitos
- Docker instalado.
- Uma chave de API do Google Maps.