const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('./db/init');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = 8742;

app.set('io', io);
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('submit_comment', (data) => io.emit('new_comment', data));
  socket.on('submit_vote', (data) => io.emit('vote_updated', data));
  socket.on('submit_guess', (data) => io.emit('guess_submitted', data));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
