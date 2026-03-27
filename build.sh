#!/bin/bash
set -e

echo "Installing dependencies..."
cd frontend
npm ci
echo "Building frontend..."
npm run build
echo "Build completed successfully!"
