FROM node:18-alpine

WORKDIR /app

# Kopíruj package files
COPY package*.json ./

# Instaluj závislosti
RUN npm install

# Kopíruj zbytek aplikace
COPY . .

# Exponuj port
EXPOSE 5000

# Spusť aplikaci
CMD ["npm", "start"]
