// client.js
window.onload = function () {
  const socket = io();

  let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  let selectedUser = null;
  let friends = JSON.parse(localStorage.getItem("friends")) || [];
  const chatTabs = JSON.parse(localStorage.getItem("chatTabs")) || {}; // userId -> chat history

  const loginScreen = document.getElementById("loginScreen");
  const chatScreen = document.getElementById("chatScreen");
  const usernameInput = document.getElementById("usernameInput");
  const joinBtn = document.getElementById("joinBtn");
  const selfUser = document.getElementById("selfUser");
  const userList = document.getElementById("userList");
  const chatBox = document.getElementById("chatBox");
  const currentChat = document.getElementById("currentChat");
  const msgInput = document.getElementById("msgInput");
  const sendBtn = document.getElementById("sendBtn");
  const friendSearchInput = document.getElementById("friendSearchInput");
  const friendSearchResults = document.getElementById("friendSearchResults");

  function updateFriendsListUI() {
    const friendsList = document.getElementById("friendsList");
    friendsList.innerHTML = "";
    friends.forEach(friend => {
      const li = document.createElement("li");
      li.textContent = `${friend.username}#${friend.tag}`;
      li.addEventListener("click", () => switchTab(friend.id));
      friendsList.appendChild(li);
    });
    localStorage.setItem("friends", JSON.stringify(friends));
  }

  function switchTab(userId) {
    selectedUser = userId;
    currentChat.innerHTML = "";
    const messages = chatTabs[userId] || [];
    messages.forEach(msg => renderMessage(msg));
  }

  function renderMessage(data) {
    const msg = document.createElement("div");
    msg.classList.add("message");
    msg.innerHTML = `<strong>${data.from}</strong>: ${parseMarkdown(data.message)}`;
    currentChat.appendChild(msg);
    currentChat.scrollTop = currentChat.scrollHeight;
  }

  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  joinBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    if (username) {
      socket.emit("register", username);
    }
  });

  socket.on("registered", user => {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    loginScreen.style.display = "none";
    chatScreen.style.display = "flex";
    selfUser.textContent = `${user.username}#${user.tag}`;
    updateFriendsListUI();
  });

  sendBtn.addEventListener("click", sendMessage);
  msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const msg = msgInput.value.trim();
    if (msg && selectedUser) {
      const data = { to: selectedUser, message: msg };
      socket.emit("private message", data);
      const local = { from: "You", message: msg };
      if (!chatTabs[selectedUser]) chatTabs[selectedUser] = [];
      chatTabs[selectedUser].push(local);
      renderMessage(local);
      msgInput.value = "";
      localStorage.setItem("chatTabs", JSON.stringify(chatTabs));
    }
  }

  socket.on("private message", data => {
    if (!chatTabs[data.fromId]) chatTabs[data.fromId] = [];
    chatTabs[data.fromId].push({ from: data.from, message: data.message });
    if (selectedUser === data.fromId) {
      renderMessage({ from: data.from, message: data.message });
    }
    localStorage.setItem("chatTabs", JSON.stringify(chatTabs));
  });

  friendSearchInput.addEventListener("input", () => {
    const query = friendSearchInput.value.trim();
    socket.emit("search users", query);
  });

  socket.on("search results", results => {
    friendSearchResults.innerHTML = "";
    results.forEach(user => {
      if (user.id !== currentUser.id && !friends.find(f => f.id === user.id)) {
        const div = document.createElement("div");
        div.textContent = `${user.username}#${user.tag}`;
        const btn = document.createElement("button");
        btn.innerHTML = '<i class="fas fa-user-plus"></i>';
        btn.addEventListener("click", () => {
          socket.emit("send friend request", user.id);
        });
        div.appendChild(btn);
        friendSearchResults.appendChild(div);
      }
    });
  });

  socket.on("friend request", user => {
    const shouldAdd = confirm(`${user.username}#${user.tag} wants to be your friend! Accept?`);
    if (shouldAdd) {
      socket.emit("accept friend", user.id);
      friends.push(user);
      updateFriendsListUI();
    } else {
      socket.emit("deny friend", user.id);
    }
  });

  socket.on("friend accepted", user => {
    friends.push(user);
    updateFriendsListUI();
  });
};
