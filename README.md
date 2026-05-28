# Hello World App

A simple Hello World application demonstrating the use of `debug` and `chalk` npm packages.

## Features

- **chalk**: Adds colorful output to the console
- **debug**: Provides flexible debugging output

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

Or directly:

```bash
node index.js
```

## Using Debug

The debug package is enabled by default in the code, but you can also control it via environment variables:

```bash
# Enable all debug output
DEBUG=app:* node index.js

# Disable debug output
DEBUG= node index.js

# Enable all debug namespaces
DEBUG=* node index.js
```

## Running with Docker

### Build the Docker image

```bash
docker build -t hello-world-app .
```

### Run the container

```bash
docker run hello-world-app
```

### Run with custom debug settings

```bash
# Disable debug output
docker run -e DEBUG= hello-world-app

# Enable all debug namespaces
docker run -e DEBUG=* hello-world-app
```

## What it does

The application displays a colorful "Hello, World!" message using chalk and logs debug information using the debug package.
