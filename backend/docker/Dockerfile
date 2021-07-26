FROM node:14-alpine3.11

WORKDIR /backend

RUN apk add --no-cache tini

COPY package*.json ./
RUN npm ci --no-optional

COPY . .

RUN set -ex; \
    chmod +x wait-for-it.sh;

VOLUME ["/backend/node_modules"]

ENTRYPOINT ["tini", "--"]
CMD ["npm", "start"]
