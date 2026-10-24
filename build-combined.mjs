import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.log("=== [1/4] Building Frontend (TanStack Start + Nitro Vercel Preset) ===");
execSync("npm install --include=dev", {
  cwd: "frontend",
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});
execSync("npm run build", {
  cwd: "frontend",
  stdio: "inherit",
  env: { ...process.env, NITRO_PRESET: "vercel" },
});

console.log("=== [2/4] Copying Nitro Output to Root .vercel/output ===");
const rootOutput = path.resolve(".vercel/output");
const frontendOutput = path.resolve("frontend/.vercel/output");

if (fs.existsSync(rootOutput)) {
  fs.rmSync(rootOutput, { recursive: true, force: true });
}
fs.cpSync(frontendOutput, rootOutput, { recursive: true });

console.log("=== [3/4] Installing Backend Dependencies & Creating api.func ===");
execSync("npm install --omit=dev", { cwd: "backend", stdio: "inherit" });

const apiFuncDir = path.join(rootOutput, "functions/api.func");
fs.mkdirSync(apiFuncDir, { recursive: true });

// Copy backend src, package.json, and node_modules into api.func
fs.cpSync("backend/src", path.join(apiFuncDir, "src"), { recursive: true });
fs.cpSync("backend/package.json", path.join(apiFuncDir, "package.json"));

if (fs.existsSync("backend/node_modules")) {
  fs.cpSync("backend/node_modules", path.join(apiFuncDir, "node_modules"), { recursive: true });
}

// Serverless function entrypoint for Express app
fs.writeFileSync(
  path.join(apiFuncDir, "index.js"),
  `import app from "./src/server.js";\nexport default app;\n`
);

// Adopt the same Node.js runtime as Nitro (e.g. nodejs24.x or nodejs22.x) to prevent discontinued runtime warnings
let serverRuntime = "nodejs22.x";
const serverFuncConfig = path.join(rootOutput, "functions/__server.func/.vc-config.json");
if (fs.existsSync(serverFuncConfig)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(serverFuncConfig, "utf-8"));
    if (parsed.runtime) serverRuntime = parsed.runtime;
  } catch (e) {
    console.warn("Could not read Nitro runtime, defaulting to nodejs22.x");
  }
}

// Vercel Serverless Function Configuration
const vcConfig = {
  runtime: serverRuntime,
  handler: "index.js",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
};
fs.writeFileSync(path.join(apiFuncDir, ".vc-config.json"), JSON.stringify(vcConfig, null, 2));
console.log(`Configured api.func with runtime: ${serverRuntime}`);


console.log("=== [4/4] Injecting /api/* route into config.json ===");
const configPath = path.join(rootOutput, "config.json");
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  config.routes = config.routes || [];

  // Remove any previous /api routes
  config.routes = config.routes.filter((r) => r.dest !== "/api" && r.dest !== "/api.func");

  // Prepend /api route at the top so it takes precedence over frontend catch-all
  config.routes.unshift({
    src: "^/api(?:/(.*))?$",
    dest: "/api",
  });

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Injected /api route rule into .vercel/output/config.json");
} else {
  console.warn("Notice: .vercel/output/config.json not found, skipping route injection.");
}

console.log("=== Unified Vercel Build Completed Successfully! ===");
