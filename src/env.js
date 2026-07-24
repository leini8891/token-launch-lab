// Loads .env from the project root before any other module reads process.env.
// Imported first by the server so env-file values are available at import time.
// Real environment variables always take precedence over .env.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(rootDir, ".env");

if (existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch {
    // Malformed .env — ignore and fall back to real env vars.
  }
}
