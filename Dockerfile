FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts \
    && npx prisma generate \
    && npm prune --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["npm", "start"]
