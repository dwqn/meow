const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

app.use(express.static('public'));

const users = new Map(); // socket.id -> { username, tag }

function generateTag(username) {
  let tag;
  do {
    tag = Math.floor(1000 + Math.random() * 9000).toString();
  } while ([...users.values()].some(u => u.username === username && u.tag === tag));
  return tag;
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', (username) => {
    const tag = generateTag(username);
    users.set(socket.id, { username, tag });
    io.emit('update-users', [...users.entries()].map(([id, u]) => ({ id, ...u })));
    socket.emit('registered', { username, tag });
  });

  socket.on('send-message', ({ to, message }) => {
    const fromUser = users.get(socket.id);
    if (users.has(to)) {
      io.to(to).emit('receive-message', {
        from: `${fromUser.username}#${fromUser.tag}`,
        message
      });
    }
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('update-users', [...users.entries()].map(([id, u]) => ({ id, ...u })));
  });
});

http.listen(3000, () => {
  console.log('✅ Server listening on http://localhost:3000');
});
