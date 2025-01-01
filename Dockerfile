FROM node:16-alpine

WORKDIR /usr/src/app

# package.json ve package-lock.json’u kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Diğer tüm dosyaları kopyala
COPY . .

# Projede 'index.js' dosyası varsa
CMD ["node", "index.js"]
