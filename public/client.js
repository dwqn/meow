window.onload = function () {
  const socket = io();

  let currentUser = null;
  let selectedUser = null;
  const chatTabs = {}; // userId -> chat history

  const loginScreen = document.getElementById("loginScreen");
  const chatScreen = document.getElementById("chatScreen");
  const usernameInput = document.getElementById("usernameInput");
  const joinBtn = document.getElementById("joinBtn");
  const selfUser = document.getElementById("selfUser");
  const userList = document.getElementById("userList");
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
    loginScreen.style.display = "none";
    chatScreen.style.display = "flex";
    selfUser.textContent = `${user.username}#${user.tag}`;
  });

  socket.on("update-users", (users) => {
    userList.innerHTML = "";
    users.forEach((user) => {
      if (user.id === currentUser.id) return;

      const btn = document.createElement("button");
      btn.textContent = `${user.username}#${user.tag}`;
      btn.onclick = () => {
        selectedUser = user;
        currentChat.textContent = `Chatting with ${user.username}#${user.tag}`;
        if (!chatTabs[user.id]) chatTabs[user.id] = [];
        chatBox.innerHTML = chatTabs[user.id].join("");
      };
      userList.appendChild(btn);
    });
  });

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
      chatBox.innerHTML = chatTabs[selectedUser.id].join("");
      msgInput.value = "";
    }
  };

  socket.on("receive-message", ({ from, message }) => {
    const match = from.match(/(.+)#(\d+)/);
    const user = Object.values(chatTabs).find((v) => v.from === from);

    const fromId = Object.entries(chatTabs).find(
      ([id, msgs]) => msgs.some((m) => m.includes(from))
    )?.[0];

    const msgHTML = `<p><b>${from}:</b> ${parseMarkdown(message)}</p>`;
    if (fromId) {
      chatTabs[fromId] = chatTabs[fromId] || [];
      chatTabs[fromId].push(msgHTML);
      if (selectedUser && selectedUser.id === fromId) {
        chatBox.innerHTML = chatTabs[fromId].join("");
      }
    } else {
      // fallback, push into general
      chatBox.innerHTML += msgHTML;
    }
  };

  function parseMarkdown(text) {
    // Basic markdown + emoji
    return text
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.*?)\*/g, "<i>$1</i>")
      .replace(/:([a-zA-Z0-9_+-]+):/g, (_, name) => {
        return emojiMap[name] || `:${name}:`;
      });
  }

  const emojiMap = {
    smile: "😄",
    sad: "😢",
    heart: "❤️",
    fire: "🔥",
    clap: "👏",
    thumbsup: "👍",
    poop: "💩",
  };
};
