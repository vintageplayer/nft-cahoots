FROM node:14.18.0

# set working directory
WORKDIR /app

# install and cache app dependencies
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# start app
CMD ["node", "server.js"]