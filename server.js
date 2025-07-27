const express = require("express");
const svgCaptcha = require("svg-captcha");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files folder for generated txt files
const FILES_DIR = path.join(__dirname, "files");
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);
app.use("/files", express.static(FILES_DIR));

const captchas = {};

function randomToken() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  token += "-captcha-" + Date.now();
  return token;
}

function randomFileName() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let name = "";
  for (let i = 0; i < 16; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return name + ".txt";
}

const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');

  body {
    margin: 0; 
    background: #000;
    font-family: 'Poppins', sans-serif;
    color: #eee;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    user-select: none;
  }
  .container {
    background: #111;
    border-radius: 16px;
    padding: 2rem 3rem;
    width: 360px;
    box-shadow: 0 0 20px #fff3;
    text-align: center;
  }
  h1 {
    margin-bottom: 1.2rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  input {
    width: 100%;
    padding: 0.6rem 1rem;
    font-size: 1.1rem;
    border-radius: 12px;
    border: none;
    outline: none;
    margin-bottom: 1.25rem;
    font-weight: 600;
    background: #222;
    color: #eee;
  }
  input::placeholder {
    color: #aaa;
  }
  button {
    padding: 0.7rem 2.2rem;
    background: #eee;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    color: #111;
    box-shadow: 0 5px 15px #eeeaa;
    transition: background 0.3s ease;
    margin: 0 0.5rem;
  }
  button:hover {
    background: #ddd;
    box-shadow: 0 7px 20px #dddcc;
  }
  svg {
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(255 255 255 / 0.1);
  }
  .error {
    color: #ff6b6b;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  .success {
    color: #4ade80;
    font-weight: 700;
    font-size: 2rem;
  }
  .clickable {
    cursor: pointer;
    padding: 2rem 4rem;
    font-size: 2.2rem;
    font-weight: 700;
    border-radius: 20px;
    background: linear-gradient(90deg, #eee, #ccc);
    box-shadow: 0 5px 15px #eeeaa;
    user-select: none;
    transition: box-shadow 0.3s ease;
    color: #111;
  }
  .clickable:hover {
    box-shadow: 0 7px 25px #dddcc;
  }
  .buttons-row {
    display: flex;
    justify-content: center;
  }
  pre.lua-code {
    background: #222;
    color: #0f0;
    font-family: "Courier New", Courier, monospace;
    font-size: 1.1rem;
    padding: 1rem;
    border-radius: 12px;
    user-select: all;
    white-space: pre-wrap;
    word-break: break-all;
    text-align: left;
    max-width: 100%;
    overflow-x: auto;
  }
`;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>!</title>
        <style>${pageStyle}</style>
      </head>
      <body>
        <div class="clickable" onclick="fetch('/new').then(r => r.text()).then(url => window.location.href = url)">
          Captcha
        </div>
      </body>
    </html>
  `);
});

app.get("/new", (req, res) => {
  const token = randomToken();
  const captcha = svgCaptcha.create({
    size: 2,          // <-- TWO characters now
    noise: 3,
    color: true,
    background: "#111",
    width: 150,
    height: 60,
    fontSize: 50,
  });
  captchas[token] = captcha.text.toLowerCase();
  captchas[token + "_svg"] = captcha.data;
  res.send(token);
});

app.get("/:token", (req, res) => {
  const token = req.params.token;
  if (!(token in captchas)) {
    return res.status(404).send(`
      <html><head><style>${pageStyle}</style></head><body>
      <div class="container"><h1>404</h1><p>Captcha not found or expired.</p></div>
      </body></html>`);
  }

  res.send(`
    <html>
      <head>
        <title>!</title>
        <style>${pageStyle}</style>
      </head>
      <body>
        <form method="POST" action="/${token}" class="container" autocomplete="off" id="captchaForm">
          <h1>Prove you're human</h1>
          <div id="captchaSvg">${captchas[token + "_svg"]}</div>
          <input name="code" placeholder="Enter captcha text" required autocomplete="off" autofocus />
          <div class="buttons-row">
            <button type="submit">Verify</button>
            <button type="button" id="refreshBtn">Refresh</button>
          </div>
        </form>

        <script>
          document.getElementById("refreshBtn").onclick = () => {
            fetch("/refresh/${token}", { method: "POST" })
              .then(res => res.json())
              .then(data => {
                document.getElementById("captchaSvg").innerHTML = data.svg;
                document.querySelector("input[name='code']").value = "";
                document.querySelector("input[name='code']").focus();
              });
          };
        </script>
      </body>
    </html>
  `);
});

app.post("/:token", (req, res) => {
  const token = req.params.token;
  const userInput = (req.body.code || "").toLowerCase();

  if (!(token in captchas)) {
    return res.status(404).send(`
      <html><head><style>${pageStyle}</style></head><body>
      <div class="container"><h1>404</h1><p>Captcha not found or expired.</p></div>
      </body></html>`);
  }

  if (userInput === captchas[token]) {
    // Create random txt file with print('hi') content
    const filename = randomFileName();
    const fileContent = "print('hi')";
    const filepath = path.join(FILES_DIR, filename);

    fs.writeFileSync(filepath, fileContent);

    // Remove captcha data
    delete captchas[token];
    delete captchas[token + "_svg"];

    // Show code block with Lua loadstring
    return res.send(`
      <html>
        <head><style>${pageStyle}</style></head>
        <body>
          <div class="container success">
            ✅ Done!<br/><br/>
            <pre class="lua-code">loadstring(game:HttpGet("http://ilovetexting.online/files/${filename}"))()</pre>
          </div>
        </body>
      </html>
    `);
  }

  // Wrong input, resend captcha page with error
  res.send(`
    <html>
      <head><style>${pageStyle}</style></head>
      <body>
        <form method="POST" action="/${token}" class="container" autocomplete="off">
          <h1>Try again</h1>
          <div class="error">❌ Incorrect captcha, please try again.</div>
          ${captchas[token + "_svg"]}
          <input name="code" placeholder="Enter captcha text" required autocomplete="off" autofocus />
          <div class="buttons-row">
            <button type="submit">Verify</button>
            <button type="button" onclick="location.reload()">Refresh</button>
          </div>
        </form>
      </body>
    </html>
  `);
});

app.post("/refresh/:token", (req, res) => {
  const token = req.params.token;
  if (!(token in captchas)) {
    return res.status(404).json({ error: "Captcha not found" });
  }
  const newCaptcha = svgCaptcha.create({
    size: 2,          // <-- TWO characters here as well
    noise: 3,
    color: true,
    background: "#111",
    width: 150,
    height: 60,
    fontSize: 50,
  });
  captchas[token] = newCaptcha.text.toLowerCase();
  captchas[token + "_svg"] = newCaptcha.data;
  res.json({ svg: newCaptcha.data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
