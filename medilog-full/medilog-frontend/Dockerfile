FROM node:18-alpine

WORKDIR /app

# Kopíruj package files
COPY package*.json ./

# Instaluj závislosti
RUN npm install

# Přijmi build argument
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Kopíruj zbytek aplikace
COPY . .

# Exponuj port
EXPOSE 3000

# Spusť aplikaci
CMD ["npm", "start"]
