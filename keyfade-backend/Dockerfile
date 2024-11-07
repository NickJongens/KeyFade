# Use the official Node.js 22 image from Docker Hub
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code to the container
COPY . .

# Expose the port your application will run on
EXPOSE 3002

# Command to start the Express application
CMD ["node", "index.js"]
