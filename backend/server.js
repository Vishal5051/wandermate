const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const userRoutes = require('./routes/users');
const pinRoutes = require('./routes/pins');
const recommendationRoutes = require('./routes/recommendations');
const marketplaceRoutes = require('./routes/marketplace');
const { bookingRouter } = require('./routes/marketplace');
const packageRoutes = require('./routes/packages');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'WanderMates API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/bookings', bookingRouter);
app.use('/api/packages', packageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// WebSocket connection handling for real-time updates
const clients = new Map(); // userId -> WebSocket connection

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle authentication
      if (data.type === 'auth') {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
        console.log(`User ${data.userId} authenticated on WebSocket`);
        ws.send(JSON.stringify({ type: 'auth_success', message: 'Connected to real-time updates' }));
      }

      // Handle activity updates broadcast
      if (data.type === 'activity_created') {
        broadcast({
          type: 'new_activity',
          activity: data.activity
        }, ws.userId);
      }

      if (data.type === 'activity_rsvp') {
        // Notify activity host
        const hostId = data.hostId;
        const hostWs = clients.get(hostId);
        if (hostWs && hostWs.readyState === WebSocket.OPEN) {
          hostWs.send(JSON.stringify({
            type: 'new_rsvp',
            activity_id: data.activityId,
            user: data.user
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      console.log(`User ${ws.userId} disconnected from WebSocket`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all connected clients except sender
function broadcast(data, excludeUserId) {
  const message = JSON.stringify(data);
  clients.forEach((client, userId) => {
    if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('\n🚀 WanderMates Backend Server Started!');
  console.log(`📡 HTTP API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
