FROM node:10-alpine

COPY . app
COPY [".env",  "/app/.env"]

WORKDIR app

RUN apk --update add bash && apk add dos2unix

RUN dos2unix /app/docker-entry.sh

RUN npm install -g node-gyp && npm install

RUN npm install sequelize-cli pm2 -g

#CMD ["node", "server.js"]









