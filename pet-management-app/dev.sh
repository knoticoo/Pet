#!/bin/bash

# 🐾 Pet Management App - Development Server with Hot Reloading
# This script starts the development server with hot reloading enabled

set -e  # Exit on any error

echo "🐾 Starting Pet Management App in Development Mode with Hot Reloading..."
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_dev() {
    echo -e "${PURPLE}[DEV]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install dependencies if needed
install_dependencies() {
    print_status "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed successfully"
    else
        print_success "Dependencies already installed"
    fi
}

# Setup environment for development
setup_dev_environment() {
    print_status "Setting up development environment..."
    
    # Get the server IP for development access
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
        print_warning "Could not detect server IP, using localhost"
    else
        print_status "Detected server IP: $SERVER_IP"
    fi
    
    # Create .env.local for development if it doesn't exist
    if [ ! -f .env.local ]; then
        print_status "Creating .env.local file for development..."
        cat > .env.local << EOL
# Development Database
DATABASE_URL="file:./dev.db"

# NextAuth.js Development
NEXTAUTH_URL="http://$SERVER_IP:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# AI Configuration for Development
OLLAMA_ENDPOINT="http://$SERVER_IP:11434"
OLLAMA_MODEL="llama3.1:8b"

# Development mode
NODE_ENV="development"
EOL
        print_success ".env.local file created for development"
    else
        print_success ".env.local file already exists"
    fi
}

# Setup database for development
setup_database() {
    print_status "Setting up database for development..."
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npm run db:generate
    
    # Push database schema
    print_status "Pushing database schema..."
    npm run db:push
    
    # Seed database if needed
    if [ ! -f "dev.db" ]; then
        print_status "Seeding database..."
        npm run db:seed
        print_success "Database seeded successfully"
    else
        print_success "Database already exists"
    fi
}

# Start development server with hot reloading
start_dev_server() {
    print_dev "Starting development server with hot reloading..."
    print_dev "🌐 Server will be available at: http://$SERVER_IP:3000"
    print_dev "🔄 Hot reloading is enabled - changes will be reflected immediately"
    print_dev "📝 Edit files in the src/ directory and see changes instantly"
    print_dev "🛑 Press Ctrl+C to stop the server"
    echo ""
    
    # Set development environment variables
    export NODE_ENV=development
    export NEXT_TELEMETRY_DISABLED=1
    
    # Start the development server
    npm run dev
}

# Main execution
main() {
    echo ""
    print_status "Starting development setup..."
    
    # Check prerequisites
    check_node
    check_npm
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_dev_environment
    
    # Setup database
    setup_database
    
    # Start development server
    start_dev_server
}

# Run main function
main "$@"