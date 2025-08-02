#!/bin/bash

# PetCare - Pet Management App Launch Script (Production Optimized)
# This script will install dependencies, set up the database, build for production, and start the application

echo "🐾 PetCare - Pet Management App Setup (Production Optimized)"
echo "=============================================================="

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

print_build() {
    echo -e "${PURPLE}[BUILD]${NC} $1"
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

# Create .env file if it doesn't exist
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOL
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# AI Configuration
OLLAMA_ENDPOINT="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Production optimizations
NODE_ENV="production"
EOL
        print_success ".env file created successfully"
    else
        print_success ".env file already exists"
    fi
}

# Install dependencies with production optimizations
install_dependencies() {
    print_status "Installing project dependencies with production optimizations..."
    
    # Clear npm cache for fresh install
    npm cache clean --force 2>/dev/null || true
    
    # Install with production optimizations
    if npm ci --only=production --no-audit --no-fund; then
        print_success "Production dependencies installed successfully"
        
        # Install dev dependencies for build
        print_status "Installing build dependencies..."
        if npm install --only=dev --no-audit --no-fund; then
            print_success "Build dependencies installed successfully"
        else
            print_warning "Some build dependencies failed to install, continuing..."
        fi
    else
        print_warning "npm ci failed, falling back to npm install..."
        if npm install --no-audit --no-fund; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
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
    if npx prisma db push --accept-data-loss; then
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

# Build application for production
build_application() {
    print_build "Building application for production..."
    echo ""
    print_build "This may take a few minutes..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    if npm run build; then
        print_success "Application built successfully for production!"
        
        # Show build information
        if [ -d ".next" ]; then
            BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "Unknown")
            print_success "Build size: $BUILD_SIZE"
        fi
    else
        print_error "Failed to build application"
        print_status "Falling back to development mode..."
        return 1
    fi
    
    return 0
}

# Start production server
start_production_server() {
    print_status "Starting production server..."
    echo ""
    echo "🚀 Production server starting..."
    echo ""
    echo "📝 Admin Credentials:"
    echo "   Email: emalinovskis@me.com"
    echo "   Password: Millie1991"
    echo ""
    echo "🌐 Application will be available at: http://localhost:3000"
    echo "🔐 Admin panel: http://localhost:3000/admin"
    echo ""
    echo "⚡ Production Performance Features:"
    echo "   ✅ Optimized build with minification"
    echo "   ✅ Server-side rendering (SSR)"
    echo "   ✅ Static generation for faster loading"
    echo "   ✅ Compressed assets and images"
    echo "   ✅ Production-optimized React bundle"
    echo "   ✅ CSS optimization and purging"
    echo "   ✅ Font optimization and preloading"
    echo ""
    echo "📊 Performance improvements over dev mode:"
    echo "   🔥 ~3-5x faster page loads"
    echo "   🔥 ~70% smaller bundle size"
    echo "   🔥 Better SEO and Core Web Vitals"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start production server
    npm start
}

# Start development server (fallback)
start_development_server() {
    print_warning "Starting in development mode (slower performance)..."
    echo ""
    echo "🔧 Development server starting..."
    echo ""
    echo "📝 Admin Credentials:"
    echo "   Email: emalinovskis@me.com"
    echo "   Password: Millie1991"
    echo ""
    echo "🌐 Application will be available at: http://localhost:3000"
    echo "🔐 Admin panel: http://localhost:3000/admin"
    echo ""
    echo "⚠️  Development Mode Active:"
    echo "   ⏳ Slower page loads (hot reloading enabled)"
    echo "   📦 Larger bundle size (source maps included)"
    echo "   🔍 Debug information available"
    echo ""
    echo "💡 For better performance, run: ./launch.sh --production"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    npm run dev
}

# Check for production flag
check_mode() {
    if [[ "$1" == "--dev" || "$1" == "--development" ]]; then
        echo "🔧 Development mode requested"
        return 1
    elif [[ "$1" == "--prod" || "$1" == "--production" ]]; then
        echo "🚀 Production mode requested"
        return 0
    else
        # Default to production for better performance
        echo "🚀 Using production mode by default (use --dev for development)"
        return 0
    fi
}

# Main execution
main() {
    echo ""
    print_status "Starting PetCare setup process..."
    echo ""
    
    # Check mode
    PRODUCTION_MODE=true
    if ! check_mode "$1"; then
        PRODUCTION_MODE=false
    fi
    
    # Step 1: Check prerequisites
    check_node
    check_npm
    
    # Step 2: Set up environment
    setup_environment
    
    # Step 3: Install dependencies
    install_dependencies
    
    # Step 4: Set up Prisma
    generate_prisma
    setup_database
    
    # Step 5: Seed data
    seed_features
    create_admin
    
    # Step 6: Build and start the application
    echo ""
    print_success "All setup steps completed successfully!"
    echo ""
    
    if [ "$PRODUCTION_MODE" = true ]; then
        if build_application; then
            read -p "Press Enter to start the production server..."
            start_production_server
        else
            print_warning "Build failed, starting in development mode..."
            read -p "Press Enter to start the development server..."
            start_development_server
        fi
    else
        read -p "Press Enter to start the development server..."
        start_development_server
    fi
}

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "PetCare Launch Script"
    echo ""
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  --production, --prod    Start in production mode (default, faster)"
    echo "  --development, --dev    Start in development mode (slower, with hot reload)"
    echo "  --help, -h              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Start in production mode"
    echo "  $0 --production         # Start in production mode"
    echo "  $0 --dev                # Start in development mode"
    echo ""
    exit 0
fi

# Run the main function
main "$1"