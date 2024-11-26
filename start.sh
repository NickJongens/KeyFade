#!/bin/bash

# Start the backend process
node /usr/src/app/keyfade-backend/index.js &

# Start the frontend process
npx serve -s /usr/src/app/keyfade-frontend/dist -l 3001 &

# Wait for any process to exit
wait -n

# Exit with the status of the process that exited first
exit $?
