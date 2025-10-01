# Use the official Node.js 18 image as the base
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

COPY package*.json ./

# Install application dependencies
RUN npm install

# Bundle the application source code
COPY . .


EXPOSE 8080

# Define the command to run your app
CMD [ "npm", "start" ]
