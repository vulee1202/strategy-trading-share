# React Application Docker Setup

This guide provides instructions on how to build and run a React application using Docker. The setup involves two stages: building the application and serving it through an Nginx web server.

---

## Prerequisites

-   Docker must be installed on your machine.
-   The application code should be located in the current working directory.

---

## Dockerfile Breakdown

### Step 1: Build the React Application

The first stage of the Dockerfile uses Node.js to build the React application:

1. **Base Image**: The build process starts from the lightweight Node.js image (`node:16-alpine`).
2. **Install Dependencies**: It installs the Node.js dependencies defined in the `package.json` file using the `npm install` command.
3. **Build the Application**: The application is built for production using `npm run build`, which outputs the static assets (HTML, JS, CSS, etc.) into the `build` directory.

### Step 2: Serve the Application Using Nginx

After building the React application, the second stage uses Nginx to serve the static files:

1. **Base Image**: The `nginx:alpine` image is used as a lightweight web server to serve the app.
2. **Static Files**: The built files from the previous step are copied into the Nginx container's default web directory (`/usr/share/nginx/html`).
3. **Expose Port**: Port `80` is exposed so that the app can be accessed on this port.
4. **Run Nginx**: Nginx is started in the foreground to serve the static files.

---

## Instructions to Build and Run the App

### Step 1: Build the Docker Image

To build the Docker image, run the following command in the directory where your `Dockerfile` is located:

```bash
docker build -t my-react-app .
```
