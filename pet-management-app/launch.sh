#!/bin/bash

# PetCare - Pet Management App Launch Script
# This script will install dependencies, set up the database, and start the application

echo "🐾 PetCare - Pet Management App Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
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

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    if npx prisma generate; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

# Set up database
setup_database() {
    print_status "Setting up database..."
    if npx prisma db push; then
        print_success "Database schema created successfully"
    else
        print_error "Failed to set up database"
        exit 1
    fi
}

# Seed features
seed_features() {
    print_status "Seeding features..."
    if npx tsx src/lib/seed-features.ts; then
        print_success "Features seeded successfully"
    else
        print_error "Failed to seed features"
        exit 1
    fi
}

# Create admin user
create_admin() {
    print_status "Creating admin user..."
    if npx tsx src/lib/create-admin.ts; then
        print_success "Admin user created successfully"
    else
        print_warning "Admin user creation failed or user already exists"
    fi
}

# Start development server
start_server() {
    print_status "Starting development server..."
    echo ""
    echo "🎉 Setup complete! Starting PetCare application..."
    echo ""
    echo "📝 Admin Credentials:"
    echo "   Email: emalinovskis@me.com"
    echo "   Password: Millie1991"
    echo ""
    echo "🌐 Application will be available at: http://localhost:3000"
    echo "🔐 Admin panel: http://localhost:3000/admin"
    echo ""
    echo "⚡ Performance Features Active:"
    echo "   ✅ React optimizations (memo, useCallback)"
    echo "   ✅ Component caching and deduplication"
    echo "   ✅ Optimized CSS compilation (Tailwind JIT)"
    echo "   ✅ Font optimization and preloading"
    echo ""
    echo "💡 For production performance testing: npm run build && npm start"
    echo "📊 For bundle analysis: npm run analyze"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    npm run dev
}

# Main execution
main() {
    echo ""
    print_status "Starting PetCare setup process..."
    echo ""
    
    # Step 1: Check prerequisites
    check_node
    check_npm
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Set up Prisma
    generate_prisma
    setup_database
    
    # Step 4: Seed data
    seed_features
    create_admin
    
    # Step 5: Start the application
    echo ""
    print_success "All setup steps completed successfully!"
    echo ""
    read -p "Press Enter to start the development server..."
    start_server
}

# Run the main function
main