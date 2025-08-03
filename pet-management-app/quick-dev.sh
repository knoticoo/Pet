#!/bin/bash

# 🐾 Quick Development Server - Hot Reloading
# Simple script to start development server quickly

echo "🐾 Quick Development Server Starting..."
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${GREEN}[DEV]${NC} Starting Next.js development server with hot reloading..."
echo -e "${PURPLE}[INFO]${NC} Server will be available at: http://localhost:3000"
echo -e "${PURPLE}[INFO]${NC} Hot reloading enabled - changes will be reflected immediately"
echo -e "${PURPLE}[INFO]${NC} Press Ctrl+C to stop the server"
echo ""

# Set development environment
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1

# Start development server
npm run dev