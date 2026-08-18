FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV PORT=8081
EXPOSE 8081

CMD ["node", "app.js"]
