const socket = io();

let currentUser = null;
let selectedUser = null;

document.getElementById("joinBtn").onclick = () => {
  const username = document.getElementById("usernameInput").value.trim();
  if (username) {
    socket.emit("register", username);
  }
};

socket.on("registered", (user) => {
  currentUser = user;
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("chatScreen").style.display = "flex";
  document.getElementById("selfUser").textContent = `${user.username}#${user.tag}`;
});

socket.on("update-users", (users) => {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  users.forEach((user) => {
    if (user.id === currentUser.id) return;
    const btn = document.createElement("button");
    btn.textContent = `${user.username}#${user.tag}`;
    btn.onclick = () => {
      selectedUser = user;
      document.getElementById("currentChat").textContent = `Chatting with ${user.username}#${user.tag}`;
      document.getElementById("chatBox").innerHTML = "";
    };
    userList.appendChild(btn);
  });
});

document.getElementById("sendBtn").onclick = () => {
  const msg = document.getElementById("msgInput").value.trim();
  if (msg && selectedUser) {
    socket.emit("send-message", {
      to: selectedUser.id,
      message: msg,
    });
    document.getElementById("chatBox").innerHTML += `<p><b>You:</b> ${msg}</p>`;
    document.getElementById("msgInput").value = "";
  }
};

socket.on("receive-message", ({ from, message }) => {
  document.getElementById("chatBox").innerHTML += `<p><b>${from}:</b> ${message}</p>`;
});
