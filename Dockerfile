# Dockerfile

FROM node:16-alpine

# Çalışma dizini
WORKDIR /app

# package.json ve package-lock.json'ı kopyala
COPY package*.json ./

# Production bağımlılıklarını yükle
RUN npm install --production

# Uygulama kodunu kopyala
COPY . .

# Uygulamayı başlat
CMD ["npm", "start"]
