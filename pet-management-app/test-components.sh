#!/bin/bash

# PetCare Component Test Script
# This script helps verify that all components are working properly

echo "🧪 PetCare Component Test Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Check if environment is set up
test_environment() {
    print_test "Checking environment setup..."
    
    if [ -f ".env" ]; then
        print_pass ".env file exists"
    else
        print_fail ".env file missing"
        echo "Run ./launch.sh to create it automatically"
    fi
    
    if [ -f "prisma/dev.db" ]; then
        print_pass "Database file exists"
    else
        print_fail "Database file missing"
        echo "Run ./launch.sh to set up the database"
    fi
}

# Test 2: Check if build works
test_build() {
    print_test "Testing build process..."
    
    if npm run build > /dev/null 2>&1; then
        print_pass "Build successful"
    else
        print_fail "Build failed"
        echo "Check for TypeScript errors or missing dependencies"
    fi
}

# Test 3: Check component files
test_components() {
    print_test "Checking component files..."
    
    components=(
        "src/components/pets/VirtualPet.tsx"
        "src/components/pets/PetPhotoGallery.tsx"
        "src/app/social/page.tsx"
        "src/app/pets/[id]/page.tsx"
        "src/app/admin/page.tsx"
    )
    
    for component in "${components[@]}"; do
        if [ -f "$component" ]; then
            print_pass "$(basename $component) exists"
        else
            print_fail "$(basename $component) missing"
        fi
    done
}

# Test 4: Check API routes
test_api_routes() {
    print_test "Checking API routes..."
    
    routes=(
        "src/app/api/pets/[id]/route.ts"
        "src/app/api/pets/[id]/photos/route.ts"
        "src/app/api/pets/[id]/companion/route.ts"
        "src/app/api/social/posts/route.ts"
        "src/app/api/expenses/route.ts"
    )
    
    for route in "${routes[@]}"; do
        if [ -f "$route" ]; then
            print_pass "$(basename $(dirname $route))/$(basename $route) exists"
        else
            print_fail "$(basename $(dirname $route))/$(basename $route) missing"
        fi
    done
}

# Test 5: Check for TypeScript errors
test_typescript() {
    print_test "Checking TypeScript compilation..."
    
    if npx tsc --noEmit > /dev/null 2>&1; then
        print_pass "TypeScript compilation successful"
    else
        print_fail "TypeScript errors found"
        echo "Run 'npx tsc --noEmit' to see detailed errors"
    fi
}

# Test 6: Check dependencies
test_dependencies() {
    print_test "Checking dependencies..."
    
    if [ -d "node_modules" ]; then
        print_pass "node_modules exists"
    else
        print_fail "node_modules missing"
        echo "Run 'npm install' to install dependencies"
    fi
    
    # Check for critical dependencies
    critical_deps=(
        "next"
        "react"
        "prisma"
        "@prisma/client"
        "next-auth"
    )
    
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_pass "$dep installed"
        else
            print_fail "$dep missing"
        fi
    done
}

# Main test runner
run_tests() {
    echo ""
    print_info "Running component tests..."
    echo ""
    
    test_environment
    echo ""
    
    test_dependencies
    echo ""
    
    test_components
    echo ""
    
    test_api_routes
    echo ""
    
    test_typescript
    echo ""
    
    test_build
    echo ""
    
    print_info "Test complete!"
    echo ""
    echo "🚀 To start the application:"
    echo "   Production mode (recommended): ./launch.sh"
    echo "   Development mode: ./launch.sh --dev"
    echo ""
    echo "🔧 To fix issues:"
    echo "   Install dependencies: npm install"
    echo "   Set up database: npx prisma db push"
    echo "   Generate Prisma client: npx prisma generate"
    echo ""
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "PetCare Component Test Script"
    echo ""
    echo "This script checks if all components and dependencies are properly set up."
    echo ""
    echo "Usage: $0"
    echo ""
    exit 0
fi

# Run the tests
run_tests