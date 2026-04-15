FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache git

# Configurar Working directory
WORKDIR /app

# Copiar arquivos de package
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]