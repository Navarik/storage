FROM node:8-alpine

WORKDIR /usr/src/service
ARG NPM_TOKEN
COPY build/.npmrc .npmrc
COPY . .
RUN npm install && npm run build && rm -f .npmrc

ENV PORT=3000

EXPOSE 3000
CMD [ "npm", "start" ]