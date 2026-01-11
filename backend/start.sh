#!/bin/bash
# Quick Start Script for ProdAIctive Backend

echo "======================================"
echo "ProdAIctive Backend - Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js is installed"
echo "Node version: $(node -v)"
echo ""

# Navigate to backend directory
cd backend || { echo "❌ Backend directory not found"; exit 1; }

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating a template..."
    cp .env.template .env 2>/dev/null || echo "MONGODB_URI=mongodb://localhost:27017/prodaictive
PORT=5000
JWT_SECRET=your_secret_key_here_change_in_production
NODE_ENV=development" > .env
    echo "✓ .env file created. Please update it with your configuration."
    echo ""
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" &> /dev/null; then
        echo "✓ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB and try again."
        echo "   Run: mongod"
    fi
else
    echo "⚠️  MongoDB CLI not found. Skipping MongoDB check."
    echo "   Make sure MongoDB is running for the app to work."
fi
echo ""

# Start the server
echo "🚀 Starting ProdAIctive Backend..."
echo "Server will be available at http://localhost:5000"
echo "API endpoints available at http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
