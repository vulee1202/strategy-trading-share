# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=20.14.0

FROM node:${NODE_VERSION}-alpine

# Use staging node environment by default.
ENV NODE_ENV staging


WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.

# RUN mkdir -p /usr/src/app/logs
# RUN chmod -R 777 /usr/src/app/logs
# RUN chown -R node:node /usr/src/app/logs
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
# Ensure directories exist before copying the config files
RUN mkdir -p /etc/rabbitmq /etc/redis

# Run the application as a non-root user.
# USER node
USER root

# Copy the rest of the source files into the image.
COPY . .
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf

# Expose the port that the application listens on.
EXPOSE 3333

# Run the application.
CMD npm run staging.api
