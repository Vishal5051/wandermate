#!/bin/bash

echo "🚀 WanderMates MVP - Automated Setup Script"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo "📋 Checking prerequisites..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@14"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib postgis"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL found${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Node.js found ($(node -v))${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found ($(npm -v))${NC}"
echo ""

# Get PostgreSQL password
echo "🔐 Database Setup"
echo "Please enter your PostgreSQL password (or press Enter for 'postgres'):"
read -s DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-postgres}
echo ""

# Create database
echo "📦 Creating database..."
PGPASSWORD=$DB_PASSWORD psql -U postgres -c "CREATE DATABASE wandermates;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database 'wandermates' created${NC}"
else
    echo -e "${YELLOW}⚠️  Database might already exist, continuing...${NC}"
fi
echo ""

# Update backend .env file
echo "⚙️  Configuring backend..."
cd backend
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5433
DB_NAME=wandermates
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD

PORT=5000
NODE_ENV=development

JWT_SECRET=wandermates-secret-key-$(date +%s)

WS_PORT=5001
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
echo -e "${GREEN}✅ Backend configuration updated${NC}"

# Install backend dependencies
echo "📥 Installing backend dependencies..."
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi
echo ""

# Initialize database
echo "🗄️  Initializing database schema..."
PGPASSWORD=$DB_PASSWORD npm run init-db
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database initialized successfully${NC}"
else
    echo -e "${RED}❌ Failed to initialize database${NC}"
    exit 1
fi
echo ""

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
cd ../frontend
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
echo ""

# Create start script
cd ..
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting WanderMates MVP..."
echo ""

# Kill any existing processes on ports 5000 and 3000
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start backend
echo "🔧 Starting backend on http://localhost:5000"
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend on http://localhost:3000"
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✨ WanderMates is starting!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5000"
echo ""
echo "🔐 Demo Login:"
echo "   Email: sarah@example.com"
echo "   Password: password123"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
EOF

chmod +x start.sh
echo -e "${GREEN}✅ Created start.sh script${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "To start the application, run:"
echo -e "${YELLOW}  ./start.sh${NC}"
echo ""
echo "Or manually in separate terminals:"
echo -e "${YELLOW}  Terminal 1: cd backend && npm start${NC}"
echo -e "${YELLOW}  Terminal 2: cd frontend && npm start${NC}"
echo ""
echo "📖 See README.md for full documentation"
echo "⚡ See QUICKSTART.md for quick reference"
echo ""
