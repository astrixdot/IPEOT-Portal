FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=9991
EXPOSE 9991
CMD ["node", "server.js"]
