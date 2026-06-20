FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Expose port for Vite development server
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
