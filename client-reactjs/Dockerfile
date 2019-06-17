FROM node:10-alpine

COPY . app

WORKDIR app

RUN npm install -g node-gyp && npm install

CMD ["npm", "start"]







