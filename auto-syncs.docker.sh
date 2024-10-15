#!/bin/bash

# Define container name and file paths
CONTAINER_NAME="app_server"
CONTAINER_PATH="/usr/src/app/database"
LOCAL_PATH="./"

while true; do
    docker cp $CONTAINER_NAME:$CONTAINER_PATH $LOCAL_PATH
    sleep 600  # 600 seconds = 10 minutes
done
