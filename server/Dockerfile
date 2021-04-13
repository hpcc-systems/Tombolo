FROM node:12-alpine

COPY . app
COPY [".env",  "/app/.env"]

WORKDIR app

RUN apk --update add bash && apk add dos2unix

RUN dos2unix /app/docker-entry.sh

RUN apk add --update python make g++ && rm -rf /var/cache/apk/*

RUN npm install -g node-gyp && npm install

RUN npm install sequelize-cli pm2 -g

#CMD ["node", "server.js"]