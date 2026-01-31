import indexHtml from "./index.html";

Bun.serve({
  port: process.env.PORT || 3000,
  routes: {
    "/": indexHtml,
    "/styles.css": Bun.file("./styles.css"),
    "/script.js": Bun.file("./script.js"),
  },
});

console.log(`Server running on port ${process.env.PORT || 3000}`);
