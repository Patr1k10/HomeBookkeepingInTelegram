FROM node:20 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    pkg-config \
    python3 \
    && apt-get clean

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    pkg-config \
    python3 \
    && apt-get clean

COPY --from=builder /app/package*.json ./

RUN npm install --only=production --legacy-peer-deps \
    && npm install canvas --build-from-source \
    && npm rebuild canvas --build-from-source

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./
# Копируем .env файл
COPY --from=builder /app/.env ./

EXPOSE 3000

CMD [ "node", "dist/main" ]