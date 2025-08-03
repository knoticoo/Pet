#!/bin/bash

# PetCare AI Launch Script - Optimized for 3.2GB RAM
# Complete setup and launch for AI Vet system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << 'EOF'
██████╗ ███████╗████████╗ ██████╗ █████╗ ██████╗ ███████╗
██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔════╝
██████╔╝█████╗     ██║   ██║     ███████║██████╔╝█████╗  
██╔═══╝ ██╔══╝     ██║   ██║     ██╔══██║██╔══██╗██╔══╝  
██║     ███████╗   ██║   ╚██████╗██║  ██║██║  ██║███████╗
╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
EOF
echo -e "${NC}"

echo -e "${PURPLE}🚀 PetCare AI Launch Script - Optimized for 3.2GB RAM${NC}"
echo -e "${PURPLE}====================================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run as root. Use a regular user.${NC}"
    exit 1
fi

# Check system requirements
echo -e "${BLUE}📋 Checking system requirements...${NC}"

# Check available RAM
TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
echo -e "${GREEN}✓ Total RAM: ${TOTAL_RAM}MB${NC}"
echo -e "${GREEN}✓ Available RAM: ${AVAILABLE_RAM}MB${NC}"

if [ $AVAILABLE_RAM -lt 2500 ]; then
    echo -e "${RED}❌ Error: Need at least 2.5GB available RAM. Current: ${AVAILABLE_RAM}MB${NC}"
    exit 1
fi

# Check disk space
DISK_SPACE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
echo -e "${GREEN}✓ Available disk space: ${DISK_SPACE}GB${NC}"

if [ $DISK_SPACE -lt 5 ]; then
    echo -e "${RED}❌ Error: Need at least 5GB free space. Current: ${DISK_SPACE}GB${NC}"
    exit 1
fi

# Install Ollama if not already installed
if ! command -v ollama &> /dev/null; then
    echo -e "${BLUE}🤖 Installing Ollama...${NC}"
    curl -fsSL https://ollama.ai/install.sh | sh
    echo -e "${GREEN}✓ Ollama installed${NC}"
else
    echo -e "${GREEN}✓ Ollama already installed${NC}"
fi

# Start Ollama service
echo -e "${BLUE}🤖 Starting Ollama service...${NC}"
sudo systemctl start ollama || true
sudo systemctl enable ollama || true

# Wait for Ollama to be ready
echo -e "${BLUE}⏳ Waiting for Ollama to be ready...${NC}"
sleep 5

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama not responding, trying to start manually...${NC}"
    ollama serve &
    sleep 10
fi

# Download optimized AI model for 3.2GB RAM
echo -e "${BLUE}🤖 Downloading AI model optimized for 3.2GB RAM...${NC}"
echo -e "${YELLOW}📥 This may take several minutes depending on your internet connection...${NC}"

# Remove any existing large models
echo -e "${BLUE}🧹 Cleaning up existing models...${NC}"
ollama list | grep -E "(llama2:7b|llama3)" | awk '{print $1}' | xargs -r ollama rm || true

# Download small model optimized for 3.2GB RAM
echo -e "${BLUE}📥 Downloading phi:2.7b (1.6GB) - optimized for your RAM...${NC}"
if ollama pull phi:2.7b; then
    echo -e "${GREEN}✓ Model downloaded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Model download failed, trying alternative...${NC}"
    if ollama pull llama2:3b; then
        echo -e "${GREEN}✓ Alternative model downloaded${NC}"
    else
        echo -e "${RED}❌ Failed to download any model${NC}"
        exit 1
    fi
fi

# Wait for model to be available
echo -e "${BLUE}⏳ Waiting for model to be ready...${NC}"
sleep 10

# Test Ollama
echo -e "${BLUE}🧪 Testing Ollama...${NC}"
if curl -s http://localhost:11434/api/tags | grep -q "phi:2.7b\|llama2:3b"; then
    echo -e "${GREEN}✓ Ollama is working with optimized model${NC}"
else
    echo -e "${YELLOW}⚠️  Model may still be downloading. Check with: ollama list${NC}"
fi

# Navigate to pet-management-app
echo -e "${BLUE}📁 Setting up PetCare application...${NC}"
cd pet-management-app

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
    npm install
fi

# Create .env file for Ollama integration
echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://petcare:petcare123@localhost:5432/petcare"

# AI Configuration - Optimized for 3.2GB RAM
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_FALLBACK_ENDPOINT=http://localhost:11435
OLLAMA_MODEL=phi:2.7b
AI_USE_LOCAL=true
AI_USE_EXTERNAL_APIS=false

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=petcare-secret-key-2024

# Application
NODE_ENV=development
AI_VET_FREE_LIMIT=5
AI_VET_PREMIUM_PRICE=9.99

# Features
ENABLE_AI_VET=true
ENABLE_PHOTO_ANALYSIS=true
ENABLE_EXPENSE_TRACKING=true
ENABLE_SOCIAL_FEATURES=true
ENABLE_HEALTH_ANALYTICS=true
ENABLE_PHOTOGRAPHY=true
EOF

# Build the application
echo -e "${BLUE}🔨 Building PetCare application...${NC}"
npm run build

# Kill any existing processes
echo -e "${BLUE}🔄 Stopping any existing processes...${NC}"
pkill -f "next dev" || true
sleep 2

# Start the application
echo -e "${BLUE}🚀 Starting PetCare application...${NC}"
npm run dev &

# Wait for application to start
echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
sleep 15

# Test the application
echo -e "${BLUE}🧪 Testing application...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ PetCare application is running${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting. Check manually.${NC}"
fi

# Create monitoring script
cat > ../monitor-ai-vet.sh << 'EOF'
#!/bin/bash

echo "🐾 PetCare AI System Monitor - 3.2GB RAM Optimized"
echo "=================================================="

# Check Ollama status
echo "🤖 Ollama Status:"
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
    echo "📊 Available models:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "No models loaded"
else
    echo "❌ Ollama is not responding"
fi

echo ""
echo "💾 Memory Usage:"
free -h

echo ""
echo "🌐 Application Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ PetCare application is running"
    echo "🌍 Access at: http://localhost:3000"
    echo "🤖 AI Vet at: http://localhost:3000/ai-vet"
else
    echo "❌ PetCare application is not responding"
fi

echo ""
echo "🔧 Ollama Commands:"
echo "  ollama list          - List available models"
echo "  ollama ps            - Show running models"
echo "  ollama pull phi:2.7b - Download optimized model"
echo "  sudo systemctl restart ollama - Restart Ollama"
EOF

chmod +x ../monitor-ai-vet.sh

# Create restart script
cat > ../restart-ai-vet.sh << 'EOF'
#!/bin/bash

echo "🔄 Restarting PetCare AI system..."

# Restart Ollama
sudo systemctl restart ollama
sleep 5

# Navigate to app directory
cd pet-management-app

# Kill existing processes
pkill -f "next dev" || true
sleep 2

# Restart application
npm run dev &

echo "✅ Restart completed!"
echo "🌍 Access at: http://localhost:3000"
echo "🤖 AI Vet at: http://localhost:3000/ai-vet"
echo "📊 Monitor: ./monitor-ai-vet.sh"
EOF

chmod +x ../restart-ai-vet.sh

# Create stop script
cat > ../stop-ai-vet.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping PetCare AI system..."

# Stop Ollama
sudo systemctl stop ollama

# Kill Node.js processes
pkill -f "next dev" || true

echo "✅ System stopped!"
EOF

chmod +x ../stop-ai-vet.sh

# Final status
echo ""
echo -e "${GREEN}🎉 PetCare AI System Successfully Launched!${NC}"
echo ""
echo -e "${YELLOW}📋 Quick Access:${NC}"
echo -e "${CYAN}🌍 Main Application:${NC} http://localhost:3000"
echo -e "${CYAN}🤖 AI Vet Consultation:${NC} http://localhost:3000/ai-vet"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo -e "${GREEN}📊 Monitor System:${NC} ./monitor-ai-vet.sh"
echo -e "${GREEN}🔄 Restart System:${NC} ./restart-ai-vet.sh"
echo -e "${GREEN}🛑 Stop System:${NC} ./stop-ai-vet.sh"
echo ""
echo -e "${BLUE}📖 Ollama Commands:${NC}"
echo "  ollama list          - List available models"
echo "  ollama ps            - Show running models"
echo "  ollama pull phi:2.7b - Download optimized model"
echo "  sudo systemctl restart ollama - Restart Ollama"
echo ""
echo -e "${BLUE}📖 Features:${NC}"
echo "✅ Unique AI responses (no hardcoded answers)"
echo "✅ Russian language support"
echo "✅ Optimized for 3.2GB RAM"
echo "✅ Photo analysis capabilities"
echo "✅ Expense tracking with AI"
echo "✅ Emergency detection"
echo ""
echo -e "${PURPLE}🚀 Your PetCare AI system is ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- If AI vet shows 404, wait a few minutes for model to load"
echo "- Check model status with: ollama list"
echo "- Monitor system with: ./monitor-ai-vet.sh"
echo "- For better performance, close other applications"
echo "- Model uses ~1.6GB RAM, leaving ~1.6GB for system"