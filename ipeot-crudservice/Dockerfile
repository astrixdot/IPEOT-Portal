FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=3034
EXPOSE 3034
CMD ["node", "server.js"]
