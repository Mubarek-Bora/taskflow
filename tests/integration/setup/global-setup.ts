import { Client } from "pg";
import { spawn, execSync, type ChildProcess } from "child_process";
import { config as loadEnv } from "dotenv";
import path from "path";
import { TEST_PORT, TEST_BASE_URL } from "./config";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
loadEnv({ path: path.join(PROJECT_ROOT, ".env") });

let serverProcess: ChildProcess | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function resetTestDatabase(testDatabaseUrl: string) {
  const target = new URL(testDatabaseUrl);
  const dbName = target.pathname.replace(/^\//, "");
  if (!dbName) throw new Error("DATABASE_URL_TEST must include a database name");

  // Can't DROP/CREATE the database you're connected to -- connect to the
  // always-present `postgres` maintenance database instead.
  const maintenanceUrl = new URL(testDatabaseUrl);
  maintenanceUrl.pathname = "/postgres";

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await client.end();
  }
}

function runMigrations(testDatabaseUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["prisma", "migrate", "deploy"], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`prisma migrate deploy exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(`${TEST_BASE_URL}/api/auth/me`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Timed out waiting for the test server to start");
}

function startServer(testDatabaseUrl: string): ChildProcess {
  return spawn("npx", ["next", "start", "-p", String(TEST_PORT)], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl, PORT: String(TEST_PORT) },
    stdio: "pipe",
    shell: true,
  });
}

export async function setup() {
  const testDatabaseUrl = requireEnv("DATABASE_URL_TEST");

  await resetTestDatabase(testDatabaseUrl);
  await runMigrations(testDatabaseUrl);

  serverProcess = startServer(testDatabaseUrl);
  serverProcess.stderr?.on("data", (chunk: Buffer) => {
    process.stderr.write(`[test-server] ${chunk.toString()}`);
  });

  await waitForServer();
}

export async function teardown() {
  if (!serverProcess || serverProcess.killed || serverProcess.pid == null) return;

  // `next start` was spawned with shell:true (required for the .cmd shim on
  // Windows), so serverProcess.pid is the shell's pid, not the actual `next`
  // process -- serverProcess.kill() only kills the shell and leaks the real
  // server holding the port. Kill the whole process tree instead.
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${serverProcess.pid} /t /f`, { stdio: "ignore" });
    } catch {
      // already exited
    }
  } else {
    serverProcess.kill();
  }
}
