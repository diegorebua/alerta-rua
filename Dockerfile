FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["node", "--import", "tsx", "server.ts"]
