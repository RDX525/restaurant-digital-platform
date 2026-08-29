const fs = require("fs");
const path = require("path");

const pageFile = path.join(
  process.cwd(),
  ".next",
  "server",
  "app",
  "page.js",
);

if (fs.existsSync(".next") && !fs.existsSync(pageFile)) {
  console.log("Clearing incomplete .next cache...");
  fs.rmSync(".next", { recursive: true, force: true });
}
