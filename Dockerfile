# Use Node.js LTS version as base image
FROM node:20-alpine

### javascript portion
# Set working directory in container
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install --production
# Copy application files
COPY index.js .

### make it spicy
WORKDIR /build
COPY pom.xml log4j-core-2.14.1.jar ./

# Set environment variable to enable debug output
ENV DEBUG=app:*
# Run the application
CMD ["node", "index.js"]
