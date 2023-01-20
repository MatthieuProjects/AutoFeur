FROM node as builder

# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build || true

FROM node:slim
# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
COPY package*.json ./
RUN npm i --omit=dev --production
COPY --from=builder /usr/src/app/dist ./dist

CMD [ "node", "dist/index.mjs" ]
