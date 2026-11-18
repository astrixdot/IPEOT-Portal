FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ENV PORT=5051
EXPOSE 5051
CMD ["node", "server.js"]
