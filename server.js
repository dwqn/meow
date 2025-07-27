const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Serve random captcha page
app.get("/captcha", (req, res) => {
  const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase(); // Random 5-letter code
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Captcha Challenge</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="captcha-container">
        <h2>Captcha</h2>
        <p id="captcha-code">${randomCode}</p>
        <input id="captcha-input" placeholder="Type code here">
        <button onclick="checkCaptcha('${randomCode}')">Submit</button>
        <div id="status"></div>
        <script>
          function checkCaptcha(code) {
            const val = document.getElementById('captcha-input').value.toUpperCase();
            document.getElementById('status').innerText = val === code ? "Done" : "Wrong, try again.";
          }
        </script>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
