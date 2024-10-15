# Node.js Application Docker Setup

This document provides instructions to build and run a Node.js application using Docker, following the structure of the provided Dockerfile. This setup is designed to handle staging environments and leverages Docker's caching mechanisms to speed up builds.

---

## Prerequisites

-   Docker installed on your machine.
-   The source code for the Node.js application should be present in the current directory.

---

## Dockerfile Breakdown

### Step 1: Base Image

-   The image is built using Node.js version `20.14.0` on Alpine Linux. Alpine provides a small and efficient base image.
-   You can adjust the `NODE_VERSION` argument to use other Node.js versions as needed.

### Step 2: Environment Variable

-   The default environment is set to `staging` using `NODE_ENV`. You can change this as per your application's needs.

### Step 3: Working Directory

-   The working directory inside the container is `/usr/src/app`. All subsequent commands will execute within this directory.

### Step 4: Dependency Management

-   The Dockerfile utilizes the `npm ci` command to install production dependencies. It leverages Docker's cache capabilities to speed up builds:
    -   **Bind Mounts**:
        -   `package.json` and `package-lock.json` are bind-mounted, which means Docker doesn't need to copy them separately.
    -   **Cache Mount**:
        -   A cache mount for `/root/.npm` is used to store npm dependencies, which speeds up future builds.

### Step 5: Non-root User

-   The application is run as the `root` user for full permissions inside the container. You can modify this if your application doesn't need root access.

### Step 6: Copying Application Files

-   The `COPY . .` command copies the entire application source into the container's working directory.

### Step 7: Port Exposure

-   The application listens on port `3333`, which is exposed for external access.

### Step 8: Starting the Application

-   The Dockerfile uses `CMD npm run staging.api` to start the application using npm. Ensure this command exists in your `package.json` under the `"scripts"` section.

---

## Build and Run the Docker Image

### Step 1: Build the Docker Image

Run the following command to build the Docker image:

```bash
docker build -t my-node-app .
```
