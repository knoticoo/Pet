#!/bin/bash

echo "🐾 PetCare AI System Status"
echo "============================"

# Check Ollama status
echo "🤖 Ollama Status:"
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
    echo "📊 Available models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "No models loaded"
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
echo "🔧 Quick Commands:"
echo "  ollama list          - List available models"
echo "  ollama ps            - Show running models"
echo "  npm run dev          - Start PetCare app"
echo "  sudo systemctl restart ollama - Restart Ollama"