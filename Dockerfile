# Use the official Node.js 22 image as the base
FROM node:22

# Set a root working directory
WORKDIR /usr/src/app

# Copy the .env file into the container for both frontend and backend
COPY .env .env

# -------- Backend Setup --------

# Set the working directory for the backend
WORKDIR /usr/src/app/keyfade-backend

# Copy backend package.json and package-lock.json
COPY keyfade-backend/package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend code
COPY keyfade-backend .

# -------- Frontend Setup --------

# Set the working directory for the frontend
WORKDIR /usr/src/app/keyfade-frontend

# Copy frontend package.json and package-lock.json
COPY keyfade-frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend code
COPY keyfade-frontend .

# Copy the .env file into the frontend directory (if required by build tools)
RUN cp /usr/src/app/.env /usr/src/app/keyfade-frontend/.env

# Build the frontend app
RUN npm run build

# Clean up unnecessary files
RUN rm -f /usr/src/app/keyfade-frontend/.env

# -------- Final Steps --------

# Set the working directory back to the root
WORKDIR /usr/src/app

# Expose both frontend and backend ports
EXPOSE 3001 3002

# Copy the start script
COPY start.sh /usr/src/app/start.sh
RUN chmod +x /usr/src/app/start.sh

# Start the applications using the start script
CMD ["/usr/src/app/start.sh"]