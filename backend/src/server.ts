import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

// In-memory data stores
type Role = 'guard' | 'supervisor' | 'admin';

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [
  {
    id: 'u-1',
    email: 'guard1@example.com',
    password: 'Passw0rd!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: 'guard',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'u-2',
    email: 'supervisor1@example.com',
    password: 'Passw0rd!',
    firstName: 'Sarah',
    lastName: 'Smith',
    phone: '+1234567891',
    role: 'supervisor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const guards: any[] = [];
const locations: any[] = [
  { id: 'loc-1', name: 'HQ', address: '1 Main St', coordinates: { latitude: 40.7, longitude: -74.0 }, type: 'building', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const incidents: any[] = [];
const messages: any[] = [];
const notifications: any[] = [];
const tracks: Record<string, any[]> = {};

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30m' });
}

function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req: any, res: any, next: any) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : undefined;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const token = signToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  res.json({
    success: true,
    data: {
      token,
      refreshToken,
      user: { ...user, password: undefined },
      expiresIn: 60 * 30,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  if (users.some(u => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ success: false, message: 'Email already exists' });
  }
  const now = new Date().toISOString();
  const user: User = {
    id: uuid(),
    email,
    password,
    firstName: firstName || 'User',
    lastName: lastName || 'New',
    phone,
    role: (role as Role) || 'guard',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  const token = signToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  res.json({ success: true, data: { token, refreshToken, user: { ...user, password: undefined }, expiresIn: 60 * 30 } });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Missing refreshToken' });
  try {
    const decoded: any = jwt.verify(refreshToken, JWT_SECRET);
    const token = signToken(decoded.sub);
    res.json({ success: true, data: { token, expiresIn: 60 * 30 } });
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

app.post('/api/auth/logout', authMiddleware, (_req, res) => {
  res.json({ success: true, data: null });
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: { ...user, password: undefined } });
});

// Guards
app.get('/api/guards', authMiddleware, (req, res) => {
  res.json({ success: true, data: { items: guards, total: guards.length, page: 1, limit: guards.length } });
});

app.get('/api/guards/:id', authMiddleware, (req, res) => {
  const item = guards.find(g => g.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Guard not found' });
  res.json({ success: true, data: item });
});

app.post('/api/guards', authMiddleware, (req, res) => {
  const item = { id: uuid(), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  guards.push(item);
  res.json({ success: true, data: item });
});

app.put('/api/guards/:id', authMiddleware, (req, res) => {
  const idx = guards.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Guard not found' });
  guards[idx] = { ...guards[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: guards[idx] });
});

app.delete('/api/guards/:id', authMiddleware, (req, res) => {
  const idx = guards.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Guard not found' });
  guards.splice(idx, 1);
  res.json({ success: true, data: null });
});

// Locations
app.get('/api/locations', authMiddleware, (_req, res) => {
  res.json({ success: true, data: locations });
});

app.put('/api/locations/:id', authMiddleware, (req, res) => {
  const idx = locations.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Location not found' });
  locations[idx] = { ...locations[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: locations[idx] });
});

// Tracking
app.post('/api/tracking/location', authMiddleware, (req, res) => {
  const { guardId, coordinates, accuracy, batteryLevel } = req.body || {};
  if (!guardId || !coordinates) return res.status(400).json({ success: false, message: 'Missing fields' });
  const rec = { id: uuid(), guardId, coordinates, accuracy, batteryLevel, time: new Date().toISOString() };
  if (!tracks[guardId]) tracks[guardId] = [];
  tracks[guardId].push(rec);
  res.json({ success: true, data: null });
});

app.get('/api/tracking/:guardId', authMiddleware, (req, res) => {
  const items = tracks[req.params.guardId] || [];
  res.json({ success: true, data: items });
});

// Incidents
app.get('/api/incidents', authMiddleware, (_req, res) => {
  res.json({ success: true, data: { items: incidents, total: incidents.length, page: 1, limit: incidents.length } });
});

app.post('/api/incidents', authMiddleware, (req, res) => {
  const item = { id: uuid(), ...req.body, status: 'reported', reportedAt: new Date().toISOString() };
  incidents.push(item);
  res.json({ success: true, data: item });
});

app.put('/api/incidents/:id', authMiddleware, (req, res) => {
  const idx = incidents.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Incident not found' });
  incidents[idx] = { ...incidents[idx], ...req.body };
  res.json({ success: true, data: incidents[idx] });
});

// Messages
app.get('/api/messages', authMiddleware, (req, res) => {
  const { conversationId } = req.query;
  const list = conversationId ? messages.filter(m => m.conversationId === conversationId) : messages;
  res.json({ success: true, data: list });
});

app.post('/api/messages', authMiddleware, (req, res) => {
  const item = { id: uuid(), createdAt: new Date().toISOString(), ...req.body };
  messages.push(item);
  res.json({ success: true, data: item });
});

// Notifications
app.get('/api/notifications', authMiddleware, (_req, res) => {
  res.json({ success: true, data: notifications });
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const idx = notifications.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Notification not found' });
  notifications[idx] = { ...notifications[idx], read: true };
  res.json({ success: true, data: null });
});

// Listen on all network interfaces (0.0.0.0) to allow access from mobile devices
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api (or use your local IP)`);
  console.log(`📱 For mobile devices, use: http://YOUR_LOCAL_IP:${PORT}/api`);
  console.log(`\n💡 To find your local IP:`);
  console.log(`   Windows: ipconfig (look for IPv4 Address)`);
  console.log(`   Mac/Linux: ifconfig or ip addr`);
});
