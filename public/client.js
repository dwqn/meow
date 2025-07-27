window.onload = function () {
  const socket = io();

  let currentUser = null;
  let selectedUser = null;
  const chatTabs = {}; // userId -> chat history
  const friends = JSON.parse(localStorage.getItem("friends")) || [];

  const loginScreen = document.getElementById("loginScreen");
  const chatScreen = document.getElementById("chatScreen");
  const usernameInput = document.getElementById("usernameInput");
  const joinBtn = document.getElementById("joinBtn");
  const selfUser = document.getElementById("selfUser");
  const userList = document.getElementById("userList");
  const tabs = document.getElementById("tabs");
  const currentChat = document.getElementById("currentChat");
  const chatBox = document.getElementById("chatBox");
  const msgInput = document.getElementById("msgInput");
  const sendBtn = document.getElementById("sendBtn");

  joinBtn.onclick = () => {
    const username = usernameInput.value.trim();
    if (username) socket.emit("register", username);
  };

  socket.on("registered", (user) => {
    currentUser = user;
    localStorage.setItem("user", JSON.stringify(user));
    loginScreen.style.display = "none";
    chatScreen.style.display = "flex";
    selfUser.textContent = `${user.username}#${user.tag}`;
  });

  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (storedUser) {
    socket.emit("register", storedUser.username);
  }

  socket.on("update-users", (users) => {
    userList.innerHTML = "";
    users.forEach((user) => {
      if (user.id === currentUser?.id) return;

      const userIsFriend = friends.some(f => f.username === user.username && f.tag === user.tag);

      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";

      const btn = document.createElement("button");
      btn.textContent = `${user.username}#${user.tag}`;
      btn.onclick = () => openChat(user);
      wrapper.appendChild(btn);

      if (!userIsFriend) {
        const addBtn = document.createElement("span");
        addBtn.textContent = "➕";
        addBtn.style.marginLeft = "5px";
        addBtn.style.cursor = "pointer";
        addBtn.onclick = (e) => {
          e.stopPropagation();
          showFriendPrompt(user);
        };
        wrapper.appendChild(addBtn);
      }

      userList.appendChild(wrapper);
    });
  });

  function openChat(user) {
    selectedUser = user;
    if (!chatTabs[user.id]) chatTabs[user.id] = [];

    updateTabs(user);
    updateChatBox();
  }

  function updateTabs(user) {
    const exists = [...tabs.children].some(tab => tab.dataset.id === user.id);
    if (!exists) {
      const tab = document.createElement("button");
      tab.textContent = `${user.username}#${user.tag}`;
      tab.dataset.id = user.id;
      tab.onclick = () => {
        selectedUser = user;
        updateChatBox();
      };
      tabs.appendChild(tab);
    }
  }

  function updateChatBox() {
    currentChat.textContent = `Chatting with ${selectedUser.username}#${selectedUser.tag}`;
    chatBox.innerHTML = chatTabs[selectedUser.id].join("");
  }

  sendBtn.onclick = () => {
    const msg = msgInput.value.trim();
    if (msg && selectedUser) {
      const formattedMsg = `<p><b>You:</b> ${parseMarkdown(msg)}</p>`;
      socket.emit("send-message", {
        to: selectedUser.id,
        message: msg,
      });

      chatTabs[selectedUser.id] = chatTabs[selectedUser.id] || [];
      chatTabs[selectedUser.id].push(formattedMsg);
      updateChatBox();
      msgInput.value = "";
    }
  };

  socket.on("receive-message", ({ from, message }) => {
    const fromId = Object.entries(chatTabs).find(
      ([id, msgs]) => msgs.some(m => m.includes(from))
    )?.[0];

    const msgHTML = `<p><b>${from}:</b> ${parseMarkdown(message)}</p>`;

    if (fromId) {
      chatTabs[fromId] = chatTabs[fromId] || [];
      chatTabs[fromId].push(msgHTML);
      if (selectedUser && selectedUser.id === fromId) {
        updateChatBox();
      }
    } else {
      chatBox.innerHTML += msgHTML;
    }
  });

  function showFriendPrompt(user) {
    if (confirm(`Accept ${user.username}#${user.tag} as a friend?`)) {
      friends.push({ username: user.username, tag: user.tag });
      localStorage.setItem("friends", JSON.stringify(friends));
      alert("Friend added! ✅");
      socket.emit("register", currentUser.username); // force UI refresh
    }
  }

  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.*?)\*/g, "<i>$1</i>")
      .replace(/:([a-zA-Z0-9_+-]+):/g, (_, name) => emojiMap[name] || `:${name}:`);
  }

  const emojiMap = {
    smile: "😄", sad: "😢", heart: "❤️", fire: "🔥",
    clap: "👏", thumbsup: "👍", poop: "💩"
  };
};
