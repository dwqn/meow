const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.static("public"));

const users = new Map();

function generateTag(username) {
  let tag;
  do {
    tag = Math.floor(1000 + Math.random() * 9999).toString();
  } while ([...users.values()].some(u => u.username === username && u.tag === tag));
  return tag;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (username) => {
    const tag = generateTag(username);
    const user = { username, tag, id: socket.id };
    users.set(socket.id, user);

    socket.emit("registered", user);
    io.emit("update-users", [...users.values()]);
  });

  socket.on("send-message", ({ to, message }) => {
    const fromUser = users.get(socket.id);
    if (users.has(to)) {
      io.to(to).emit("receive-message", {
        from: `${fromUser.username}#${fromUser.tag}`,
        message,
      });
    }
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    io.emit("update-users", [...users.values()]);
  });
});

http.listen(3000, () => {
  console.log("Server running: http://localhost:3000");
});
