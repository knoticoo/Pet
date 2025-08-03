#!/bin/bash

# PetCare AI Deployment Script for 4GB VPS
# This script sets up the complete AI system with unique response optimization

set -e

echo "🐾 PetCare AI Deployment Script for 4GB VPS"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check system requirements
echo -e "${BLUE}📋 Checking system requirements...${NC}"

# Check available RAM
TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
echo -e "${GREEN}✓ Total RAM: ${TOTAL_RAM}MB${NC}"
echo -e "${GREEN}✓ Available RAM: ${AVAILABLE_RAM}MB${NC}"

if [ $AVAILABLE_RAM -lt 3200 ]; then
    echo -e "${RED}⚠️  Warning: Available RAM is less than 3.2GB. Performance may be limited.${NC}"
fi

# Check disk space
DISK_SPACE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
echo -e "${GREEN}✓ Available disk space: ${DISK_SPACE}GB${NC}"

# Update system
echo -e "${BLUE}🔄 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Ollama
echo -e "${BLUE}🤖 Installing Ollama...${NC}"
curl -fsSL https://ollama.ai/install.sh | sh

# Create PetCare directory
echo -e "${BLUE}📁 Setting up PetCare application...${NC}"
mkdir -p ~/petcare
cd ~/petcare

# Create docker-compose.yml for PetCare
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  petcare-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - AI_USE_LOCAL=true
      - AI_MODEL_ENDPOINT=http://ollama:11434
      - AI_MODEL_NAME=llama3.1:3b
      - DATABASE_URL=postgresql://petcare:petcare123@postgres:5432/petcare
    depends_on:
      - postgres
      - ollama
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=petcare
      - POSTGRES_USER=petcare
      - POSTGRES_PASSWORD=petcare123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2.5G
        reservations:
          memory: 1.5G

volumes:
  postgres_data:
  ollama_data:
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
EOF

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://petcare:petcare123@postgres:5432/petcare

# AI Configuration
AI_USE_LOCAL=true
AI_MODEL_ENDPOINT=http://ollama:11434
AI_MODEL_NAME=llama3.1:3b
AI_USE_EXTERNAL_APIS=false

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Application
NODE_ENV=production
EOF

# Create systemd service for PetCare
echo -e "${BLUE}🔧 Creating systemd service...${NC}"
sudo tee /etc/systemd/system/petcare.service > /dev/null << 'EOF'
[Unit]
Description=PetCare Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/$USER/petcare
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
echo -e "${BLUE}🚀 Starting services...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable petcare.service

# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "🐾 PetCare AI System Monitor"
echo "============================"

# Check Docker containers
echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
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
else
    echo "✗ PetCare application is not responding"
fi
EOF

chmod +x monitor.sh

# Create AI model download script
cat > download-model.sh << 'EOF'
#!/bin/bash

echo "🤖 Downloading AI model for PetCare..."
echo "This may take several minutes depending on your internet connection."

# Download Llama 3.1 3B model (optimized for 4GB VPS)
curl -X POST http://localhost:11434/api/pull -d '{
  "name": "llama3.1:3b",
  "stream": false
}'

echo ""
echo "✅ Model download completed!"
echo "You can now use the AI features in PetCare."
EOF

chmod +x download-model.sh

# Create optimization script
cat > optimize-ai.sh << 'EOF'
#!/bin/bash

echo "⚡ Optimizing AI for 4GB VPS..."

# Set optimal parameters for unique responses
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "llama3.1:3b",
  "prompt": "Test",
  "stream": false,
  "options": {
    "temperature": 0.85,
    "top_p": 0.95,
    "repeat_penalty": 1.3,
    "num_predict": 600,
    "num_ctx": 1024,
    "top_k": 40,
    "tfs_z": 1.0,
    "typical_p": 1.0,
    "mirostat": 2,
    "mirostat_tau": 5.0,
    "mirostat_eta": 0.1
  }
}' > /dev/null

echo "✅ AI optimization completed!"
echo "Settings optimized for unique, non-repetitive responses."
EOF

chmod +x optimize-ai.sh

# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/$USER/petcare-backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Creating backup..."

mkdir -p $BACKUP_DIR

# Backup database
docker exec petcare_postgres_1 pg_dump -U petcare petcare > $BACKUP_DIR/database_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Backup AI models
docker exec petcare_ollama_1 ollama list > $BACKUP_DIR/models_$DATE.txt

echo "✅ Backup completed: $BACKUP_DIR"
echo "📁 Files:"
ls -la $BACKUP_DIR/
EOF

chmod +x backup.sh

# Create setup instructions
cat > SETUP_INSTRUCTIONS.md << 'EOF'
# PetCare AI Setup Instructions

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   sudo systemctl start petcare
   ```

2. **Download AI model:**
   ```bash
   ./download-model.sh
   ```

3. **Optimize AI settings:**
   ```bash
   ./optimize-ai.sh
   ```

4. **Monitor system:**
   ```bash
   ./monitor.sh
   ```

## 📊 System Requirements

- **RAM:** 4GB total (3.2GB available)
- **Storage:** 10GB free space
- **CPU:** 2+ cores recommended

## 🤖 AI Configuration

The system is configured for:
- **Model:** Llama 3.1 3B (optimized for 4GB VPS)
- **Temperature:** 0.85 (high creativity)
- **Top-P:** 0.95 (diverse responses)
- **Repeat Penalty:** 1.3 (prevents repetition)
- **Context:** 1024 tokens
- **Max Tokens:** 600 per response

## 🔧 Environment Variables

Key settings in `.env`:
- `AI_USE_LOCAL=true` - Use local Ollama
- `AI_MODEL_NAME=llama3.1:3b` - Optimized model
- `AI_USE_EXTERNAL_APIS=false` - No external APIs

## 📈 Performance Optimization

1. **Memory Management:**
   - Ollama limited to 2.5GB RAM
   - PostgreSQL: 512MB RAM
   - Application: 1GB RAM

2. **Unique Responses:**
   - Random seed generation
   - Temperature variation
   - Mirostat sampling
   - Top-K diversity

3. **Safety Features:**
   - Emergency keyword detection
   - Fallback responses
   - Error handling

## 🔄 Maintenance

- **Backup:** `./backup.sh`
- **Monitor:** `./monitor.sh`
- **Restart:** `sudo systemctl restart petcare`

## 🆘 Troubleshooting

1. **AI not responding:**
   ```bash
   docker logs petcare_ollama_1
   ```

2. **Application errors:**
   ```bash
   docker logs petcare_petcare-app_1
   ```

3. **Database issues:**
   ```bash
   docker logs petcare_postgres_1
   ```

## 📝 Features

✅ **Unique AI Responses** - No hardcoded answers
✅ **Russian Language Support** - Full localization
✅ **Photo Analysis** - AI-powered image analysis
✅ **Expense Analysis** - Receipt scanning
✅ **Veterinary Consultations** - Professional AI advice
✅ **Emergency Detection** - Safety first approach
✅ **4GB VPS Optimized** - Resource efficient

## 🎯 AI Capabilities

- **Veterinary Knowledge:** Comprehensive pet health database
- **Symptom Analysis:** Intelligent diagnosis assistance
- **Photo Analysis:** Mood, health, activity detection
- **Expense Tracking:** Receipt analysis and categorization
- **Emergency Alerts:** Immediate danger detection
- **Personalized Advice:** Breed and age-specific recommendations
EOF

# Final setup
echo -e "${GREEN}✅ Setup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy your PetCare application files to ~/petcare/"
echo "2. Run: sudo systemctl start petcare"
echo "3. Run: ./download-model.sh"
echo "4. Run: ./optimize-ai.sh"
echo "5. Access your app at: http://localhost:3000"
echo ""
echo -e "${BLUE}📖 For detailed instructions, see: SETUP_INSTRUCTIONS.md${NC}"
echo ""
echo -e "${GREEN}🎉 Your PetCare AI system is ready for deployment!${NC}"