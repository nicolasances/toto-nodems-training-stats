FROM node:8.9.4-alpine

RUN mkdir /app

COPY . /app/

CMD node /app/index.js
