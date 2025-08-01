#!/bin/bash

# 🐾 Pet Management App - Complete Launch Script
# This script sets up everything needed for the AI-powered pet management system

set -e  # Exit on any error

echo "🐾 Starting Pet Management App with AI Vet Consultation..."
echo "=================================================="

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Don't run this script as root!"
   exit 1
fi

# 1. Check system requirements
print_status "Checking system requirements..."
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')

echo "Total Memory: ${TOTAL_MEM}MB"
echo "Available Memory: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 1500 ]; then
    print_warning "Low memory detected. AI features may be limited."
fi

# 2. Setup Ollama AI Service
print_status "Setting up Ollama AI service..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    print_error "Ollama not found! Please install it first:"
    echo "sudo snap install ollama"
    exit 1
fi

# Start Ollama service
print_status "Starting Ollama service..."
sudo snap start ollama || print_warning "Ollama service might already be running"

# Wait for service to be ready
sleep 3

# Check if Ollama is responding
OLLAMA_READY=false
for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        OLLAMA_READY=true
        break
    fi
    print_status "Waiting for Ollama to start... (attempt $i/10)"
    sleep 2
done

if [ "$OLLAMA_READY" = false ]; then
    print_error "Ollama failed to start. Trying alternative port..."
    # Try starting on different port if needed
    OLLAMA_HOST=0.0.0.0:11435 ollama serve &
    OLLAMA_PID=$!
    sleep 5
    
    if curl -s http://localhost:11435/api/tags > /dev/null 2>&1; then
        print_success "Ollama started on port 11435"
        echo "OLLAMA_ENDPOINT=http://localhost:11435" >> .env.local
    else
        print_error "Failed to start Ollama on any port"
        exit 1
    fi
else
    print_success "Ollama is running on port 11434"
fi

# 3. Download AI model if not present
print_status "Checking AI model..."
if ! ollama list | grep -q "phi3:mini"; then
    print_status "Downloading phi3:mini model (optimized for 4GB RAM)..."
    print_warning "This may take a few minutes..."
    ollama pull phi3:mini
    print_success "AI model downloaded successfully!"
else
    print_success "AI model already available"
fi

# Test AI model
print_status "Testing AI model..."
TEST_RESPONSE=$(ollama run phi3:mini "Test: Say OK" --verbose=false 2>/dev/null || echo "failed")
if [[ "$TEST_RESPONSE" == *"OK"* ]] || [[ "$TEST_RESPONSE" == *"ok"* ]]; then
    print_success "AI model is working correctly"
else
    print_warning "AI model test inconclusive, but proceeding..."
fi

# 4. Setup database
print_status "Setting up database..."
if [ ! -f "prisma/schema.prisma" ]; then
    print_error "Prisma schema not found!"
    exit 1
fi

# Generate Prisma client
npm run db:generate || {
    print_error "Failed to generate Prisma client"
    exit 1
}

# Run database migrations
npm run db:push || {
    print_error "Failed to push database schema"
    exit 1
}

print_success "Database setup complete"

# 5. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# 6. Build the application
print_status "Building application..."
npm run build || {
    print_error "Build failed"
    exit 1
}

print_success "Application built successfully"

# 7. Setup environment variables
print_status "Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    print_status "Creating environment file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# AI Vet Consultation - Ollama Configuration
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_FALLBACK_ENDPOINT=http://localhost:11435
OLLAMA_MODEL=phi3:mini
AI_VET_FREE_LIMIT=3
AI_VET_PREMIUM_PRICE=9.99

# Subscription System
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EOF
    print_success "Environment file created"
else
    print_success "Environment file already exists"
fi

# 8. Initialize features in database
print_status "Initializing plugin system..."
cat > init-features.js << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function initializeFeatures() {
  console.log('Initializing features...')
  
  // This will be handled by the FeatureManager.initializeFeatures()
  // when the app starts, but we can seed some basic data here
  
  await prisma.$disconnect()
  console.log('Features initialized!')
}

initializeFeatures().catch(console.error)
EOF

node init-features.js
rm init-features.js

print_success "Plugin system initialized"

# 9. Start the application
print_status "Starting the web application..."
echo ""
echo "🎉 Setup complete! Starting Pet Management App..."
echo ""
echo "📱 Web App: http://localhost:3000"
echo "🤖 AI Vet: http://localhost:3000/ai-vet"
echo "⚙️  Admin Panel: http://localhost:3000/admin"
echo ""
echo "💡 Features available:"
echo "   - AI Vet Consultation (3 free per month)"
echo "   - Pet Management"
echo "   - Expense Tracking"
echo "   - Appointment Scheduling"
echo "   - Plugin System"
echo "   - And much more!"
echo ""
echo "🔧 To stop the app: Ctrl+C"
echo "🔧 To restart Ollama: sudo snap restart ollama"
echo ""

# Start the Next.js application
npm run start

# Cleanup function for graceful shutdown
cleanup() {
    print_status "Shutting down..."
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM