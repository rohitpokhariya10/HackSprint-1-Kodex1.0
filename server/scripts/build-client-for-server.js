const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const serverRoot = path.join(__dirname, "..");
const repoRoot = path.join(serverRoot, "..");
const clientRoot = path.join(repoRoot, "client");
const clientDist = path.join(clientRoot, "dist");
const serverView = path.join(serverRoot, "view");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (command, args, cwd) => {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
};

const removeContents = (directory) => {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory)) {
    fs.rmSync(path.join(directory, entry), {
      recursive: true,
      force: true,
    });
  }
};

const copyDirectory = (source, destination) => {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
  });
};

if (!fs.existsSync(path.join(clientRoot, "package.json"))) {
  console.log("Client app not found. Skipping frontend build.");
  process.exit(0);
}

console.log("Building client for server/view...");
if (fs.existsSync(path.join(clientRoot, "node_modules"))) {
  console.log("Client dependencies already installed. Skipping install.");
} else if (fs.existsSync(path.join(clientRoot, "package-lock.json"))) {
  run(npmCommand, ["ci", "--include=dev"], clientRoot);
} else {
  run(npmCommand, ["install", "--include=dev", "--no-package-lock"], clientRoot);
}
run(npmCommand, ["run", "build"], clientRoot);
removeContents(serverView);
copyDirectory(clientDist, serverView);
console.log("Client build copied to server/view.");
