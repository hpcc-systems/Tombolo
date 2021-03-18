FROM node:14.9.0-alpine as build

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app/

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/nginx.conf

COPY nginx/conf.d/nginx.conf.template /etc/nginx/conf.d/nginx.conf.template

COPY nginx/run_nginx.sh /etc/nginx/run_nginx.sh

RUN ["chmod", "+x", "/etc/nginx/run_nginx.sh"]