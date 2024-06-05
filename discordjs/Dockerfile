FROM node as builder

# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
COPY package*.json ./
RUN npm i
COPY . .

CMD [ "node", "src/index.mjs" ]