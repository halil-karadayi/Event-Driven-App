# Temel olarak resmi Node.js image'ını kullanın.
FROM node:14

# Çalışma dizinini belirleyin.
WORKDIR /usr/src/app

# Uygulama bağımlılıklarınızı kopyalayın ve kurun.
COPY package*.json ./
RUN npm install

# Uygulama kaynak kodunu kopyalayın.
COPY . .

# Uygulamanın çalıştırılacağı portu belirtin.
EXPOSE 3000

# Uygulamayı çalıştırın.
CMD ["node", "app.js"]

