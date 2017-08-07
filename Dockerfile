FROM node:latest

WORKDIR /kirito

COPY . .
RUN npm install

CMD npm start
