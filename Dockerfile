FROM node:alpine AS builder
WORKDIR /usr/src/kirito
COPY . .
RUN npm install && \
    npm run build && \
    mkdir ./builder && \
    mv ./build ./builder/build && \
    mv ./tsconfig.json ./builder/tsconfig.json && \
    mv ./package.json ./builder/package.json && \
    mv ./src/interface ./builder/build/interface

FROM timbru31/node-chrome:alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/kirito/builder .
RUN npm install --production
CMD npm run production
