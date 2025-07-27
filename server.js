const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const counterPath = path.join(__dirname, "visits.json");

app.use(express.static("public"));

app.get("/", (req, res) => {
  let count = 0;

  if (fs.existsSync(counterPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(counterPath));
      count = data.count || 0;
    } catch (err) {}
  }

  count++;
  fs.writeFileSync(counterPath, JSON.stringify({ count }));

  const html = fs.readFileSync(path.join(__dirname, "public/index.html"), "utf8");
  res.send(html.replace("{{VISIT_COUNT}}", count));
});

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
