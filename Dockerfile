FROM node:8.9-alpine

WORKDIR /usr/src/service
ARG NPM_TOKEN
COPY build/.npmrc .npmrc
COPY . .
RUN npm install && npm run build && rm -f .npmrc

ENV PORT=3000
ENV TEMP_DIRECTORY=/tmp

EXPOSE 3000
CMD [ "npm", "start" ]