#!/bin/bash

# PetCare AI Launch Script - Ollama Integration
# For existing pet-management-app with Ollama AI

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

echo -e "${PURPLE}🚀 PetCare AI Launch Script - Ollama Integration${NC}"
echo -e "${PURPLE}================================================${NC}"
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

if [ $AVAILABLE_RAM -lt 3200 ]; then
    echo -e "${YELLOW}⚠️  Warning: Available RAM is less than 3.2GB. Performance may be limited.${NC}"
fi

# Check disk space
DISK_SPACE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
echo -e "${GREEN}✓ Available disk space: ${DISK_SPACE}GB${NC}"

if [ $DISK_SPACE -lt 10 ]; then
    echo -e "${RED}❌ Error: Need at least 10GB free space. Current: ${DISK_SPACE}GB${NC}"
    exit 1
fi

# Check if Ollama is installed
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

# Download AI model for 4GB RAM
echo -e "${BLUE}🤖 Downloading AI model optimized for 4GB RAM...${NC}"
echo -e "${YELLOW}📥 This may take several minutes depending on your internet connection...${NC}"

# Try to pull the model
if curl -X POST http://localhost:11434/api/pull -d '{
  "name": "llama3.1:3b-instruct",
  "stream": false
}' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Model download started successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Model download may take time. You can check status later.${NC}"
fi

# Wait for model to be available
echo -e "${BLUE}⏳ Waiting for model to be ready...${NC}"
sleep 30

# Test Ollama
echo -e "${BLUE}🧪 Testing Ollama...${NC}"
if curl -s http://localhost:11434/api/tags | grep -q "llama3.1:3b-instruct"; then
    echo -e "${GREEN}✓ Ollama is working with llama3.1:3b-instruct model${NC}"
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

# AI Configuration
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_FALLBACK_ENDPOINT=http://localhost:11435
OLLAMA_MODEL=llama3.1:3b-instruct
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

# Start the application
echo -e "${BLUE}🚀 Starting PetCare application...${NC}"
npm run dev &

# Wait for application to start
echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
sleep 10

# Test the application
echo -e "${BLUE}🧪 Testing application...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ PetCare application is running${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting. Check manually.${NC}"
fi

# Create monitoring script
cat > monitor-ollama.sh << 'EOF'
#!/bin/bash

echo "🐾 PetCare AI System Monitor"
echo "============================"

# Check Ollama status
echo "🤖 Ollama Status:"
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✓ Ollama is running"
    echo "📊 Available models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "No models loaded"
else
    echo "✗ Ollama is not responding"
fi

echo ""
echo "💾 Memory Usage:"
free -h

echo ""
echo "💿 Disk Usage:"
df -h /

echo ""
echo "🌐 Application Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ PetCare application is running"
    echo "🌍 Access at: http://localhost:3000"
    echo "🤖 AI Vet at: http://localhost:3000/ai-vet"
else
    echo "✗ PetCare application is not responding"
fi

echo ""
echo "🔧 Ollama Commands:"
echo "  ollama list          - List available models"
echo "  ollama ps            - Show running models"
echo "  ollama pull llama3.1:3b-instruct - Download model"
echo "  sudo systemctl restart ollama - Restart Ollama"
EOF

chmod +x monitor-ollama.sh

# Create restart script
cat > restart-ollama.sh << 'EOF'
#!/bin/bash

echo "🔄 Restarting PetCare application with Ollama..."

# Restart Ollama
sudo systemctl restart ollama
sleep 5

# Navigate to app directory
cd pet-management-app

# Restart application
npm run dev &

echo "✅ Restart completed!"
echo "🌍 Access at: http://localhost:3000"
echo "🤖 AI Vet at: http://localhost:3000/ai-vet"
echo "📊 Monitor: ./monitor-ollama.sh"
EOF

chmod +x restart-ollama.sh

# Create stop script
cat > stop-ollama.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping PetCare application..."

# Stop Ollama
sudo systemctl stop ollama

# Kill Node.js processes
pkill -f "next dev" || true

echo "✅ Application stopped!"
EOF

chmod +x stop-ollama.sh

# Final status
echo ""
echo -e "${GREEN}🎉 PetCare AI Application Successfully Launched!${NC}"
echo ""
echo -e "${YELLOW}📋 Quick Access:${NC}"
echo -e "${CYAN}🌍 Main Application:${NC} http://localhost:3000"
echo -e "${CYAN}🤖 AI Vet Consultation:${NC} http://localhost:3000/ai-vet"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo -e "${GREEN}📊 Monitor System:${NC} ./monitor-ollama.sh"
echo -e "${GREEN}🔄 Restart App:${NC} ./restart-ollama.sh"
echo -e "${GREEN}🛑 Stop App:${NC} ./stop-ollama.sh"
echo ""
echo -e "${BLUE}📖 Ollama Commands:${NC}"
echo "  ollama list          - List available models"
echo "  ollama ps            - Show running models"
echo "  ollama pull llama3.1:3b-instruct - Download model"
echo "  sudo systemctl restart ollama - Restart Ollama"
echo ""
echo -e "${BLUE}📖 Features:${NC}"
echo "✅ Unique AI responses (no hardcoded answers)"
echo "✅ Russian language support"
echo "✅ Optimized for 4GB VPS"
echo "✅ Photo analysis capabilities"
echo "✅ Expense tracking with AI"
echo "✅ Emergency detection"
echo ""
echo -e "${PURPLE}🚀 Your PetCare AI system is ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- If AI vet shows 404, wait a few minutes for model to load"
echo "- Check model status with: ollama list"
echo "- Monitor system with: ./monitor-ollama.sh"
echo "- For better performance, close other applications"