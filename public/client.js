const socket = io();

let currentUser = null;
let selectedUser = null;

document.getElementById("joinBtn").onclick = () => {
  const username = document.getElementById("usernameInput").value.trim();
  if (username) socket.emit("register", username);
};

socket.on("registered", ({ username, tag }) => {
  currentUser = { username, tag };
  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "block";
  document.getElementById("yourName").innerText = `You: ${username}#${tag}`;
});

socket.on("update-users", (users) => {
  const list = document.getElementById("onlineUsers");
  list.innerHTML = "<h4>Online Users</h4>";
  users.forEach((user) => {
    if (user.username === currentUser.username && user.tag === currentUser.tag) return;
    const btn = document.createElement("button");
    btn.textContent = `${user.username}#${user.tag}`;
    btn.onclick = () => {
      selectedUser = user;
      document.getElementById("chatBox").innerHTML = `<h4>Chatting with ${selectedUser.username}#${selectedUser.tag}</h4>`;
    };
    list.appendChild(btn);
  });
});

document.getElementById("sendBtn").onclick = () => {
  const msg = document.getElementById("msgInput").value.trim();
  if (msg && selectedUser) {
    socket.emit("send-message", { to: selectedUser.id, message: msg });
    document.getElementById("chatBox").innerHTML += `<p><b>You:</b> ${msg}</p>`;
    document.getElementById("msgInput").value = "";
  }
};

socket.on("receive-message", ({ from, message }) => {
  document.getElementById("chatBox").innerHTML += `<p><b>${from}:</b> ${message}</p>`;
});
