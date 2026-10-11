import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { startReminderScheduler } from './jobs/reminderScheduler.js';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true } });
io.use((socket,next)=>{try{const token=socket.handshake.auth?.token;const payload=jwt.verify(token,process.env.JWT_ACCESS_SECRET);socket.data.userId=payload.sub;next();}catch{next(new Error('Unauthorized'));}});
io.on('connection', socket => { socket.join(`user:${socket.data.userId}`); });
const port = process.env.PORT || 5000;
try { await connectDB(); startReminderScheduler(io); server.listen(port, ()=>console.log(`MediTrack API listening on ${port}`)); }
catch (error) { console.error(`Startup failed: ${error.message}`); process.exit(1); }
