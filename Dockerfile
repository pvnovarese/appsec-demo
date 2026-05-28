# Use Node.js LTS version as base image
FROM node:20-alpine

# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY index.js .

# Set environment variable to enable debug output
ENV DEBUG=app:*

# Run the application
CMD ["node", "index.js"]
