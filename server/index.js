const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

const server = http.createServer(app);

const io = new Server(server, { 
  cors: {
    origin: 'http://localhost:3000', // Разрешить подключение от клиента
    methods: ['GET', 'POST'],
  }
});

/*io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('sendMessage', (data) => {
    console.log('Received message from client:', data);

    socket.emit('receiveMessage', { status: 'Message received!', data });
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});*/

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});