# Use the official Node.js image from the Docker Hub
FROM node:22

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if you have one)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Install serve globally to serve the build
RUN npm install -g serve

# Expose the port that serve will run on
EXPOSE 3001

# Command to serve the built app
CMD ["serve", "-s", "dist", "-l", "3001"]
