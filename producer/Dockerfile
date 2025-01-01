FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN ls -la && npm install
COPY . .
CMD ["node", "index.js"]
