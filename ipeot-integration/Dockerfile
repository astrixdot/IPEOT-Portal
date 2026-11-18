FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ENV PORT=3035
EXPOSE 3035
CMD ["node", "server.js"]
