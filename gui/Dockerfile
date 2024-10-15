# Step 1: Build the React app
FROM node:16-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app for production
RUN npm run build

# Step 2: Serve the app with a lightweight web server
FROM nginx:alpine

# Copy nginx cofiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the previous step
COPY --from=build /app/build /usr/share/nginx/html

# Expose the port that the app will run on
EXPOSE 80

# Start the web server
CMD ["nginx", "-g", "daemon off;"]
