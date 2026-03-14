const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const process = require("node:process");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const rootCwd = path.resolve(__dirname, "..");
const appDirCandidates = [process.env.MOBILE_APP_DIR, "NH-S19-App", "mobile"].filter(Boolean);
const appDir = appDirCandidates.find((dirName) =>
  fs.existsSync(path.join(rootCwd, dirName, "package.json"))
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPortFree = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });

const findAvailablePort = async (ports) => {
  for (const port of ports) {
    // Use first free preferred port to avoid interactive Expo prompts.
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);

    if (free) {
      return port;
    }
  }

  return null;
};

const probeBackend = async () => {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);

      const response = await fetch("http://localhost:5050/api/health", {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        return true;
      }
    } catch {
      // Ignore probe errors and retry briefly.
    }

    await wait(220);
  }

  return false;
};

const prefixWrite = (prefix, output, isError = false) => {
  if (!output) {
    return;
  }

  const text = output.toString();
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line && index === lines.length - 1) {
      return;
    }

    const target = isError ? process.stderr : process.stdout;
    target.write(`[${prefix}] ${line}\n`);
  });
};

const quoteArg = (arg) => {
  const value = String(arg);
  if (!/[\s"']/g.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
};

const spawnProcess = (name, args, options = {}) => {
  const { interactive = false } = options;
  const command = [npmCmd, ...args].map(quoteArg).join(" ");

  const child = spawn(command, {
    cwd: rootCwd,
    env: process.env,
    windowsHide: false,
    shell: true,
    stdio: interactive ? "inherit" : ["ignore", "pipe", "pipe"]
  });

  if (!interactive) {
    child.stdout.on("data", (data) => prefixWrite(name, data, false));
    child.stderr.on("data", (data) => prefixWrite(name, data, true));
  }

  child.on("error", (error) => {
    process.stderr.write(`[${name}] Failed to start: ${error.message}\n`);
  });

  return child;
};

(async () => {
  if (!appDir) {
    process.stderr.write(
      "[launcher] Could not find app directory. Expected NH-S19-App (or mobile) with package.json.\n"
    );
    process.exit(1);
  }

  const children = [];
  let shuttingDown = false;
  const expoPort = await findAvailablePort([8081, 8082, 8083, 8084, 8085]);

  if (!expoPort) {
    process.stderr.write(
      "[launcher] Could not find a free Expo port in 8081-8085. Close existing Expo servers and retry.\n"
    );
    process.exit(1);
  }

  const killAll = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    children.forEach((entry) => {
      if (!entry.child.killed) {
        entry.child.kill("SIGINT");
      }
    });

    setTimeout(() => {
      children.forEach((entry) => {
        if (!entry.child.killed) {
          entry.child.kill("SIGTERM");
        }
      });
    }, 1200);
  };

  process.on("SIGINT", () => {
    process.stdout.write("\nStopping services...\n");
    killAll();
  });

  process.on("SIGTERM", () => {
    process.stdout.write("\nStopping services...\n");
    killAll();
  });

  const backendAlreadyUp = await probeBackend();

  if (backendAlreadyUp) {
    process.stdout.write("[launcher] Backend already running on :5050. Skipping backend start.\n");
  } else {
    process.stdout.write("[launcher] Starting backend service...\n");
    children.push({
      name: "backend",
      child: spawnProcess("backend", ["--prefix", "backend", "run", "start"])
    });
  }

  process.stdout.write(`[launcher] Starting app (${appDir}) in LAN mode on port ${expoPort}...\n`);
  process.stdout.write(
    `[launcher] QR should appear below. If not, open http://localhost:${expoPort} on this PC.\n`
  );
  children.push({
    name: "app",
    child: spawnProcess(
      "app",
      [
        "--prefix",
        appDir,
        "run",
        "start",
        "--",
        "--host",
        "lan",
        "--clear",
        "--port",
        String(expoPort)
      ],
      { interactive: true }
    )
  });

  let remaining = children.length;

  if (remaining === 0) {
    process.stdout.write("[launcher] Nothing to start.\n");
    process.exit(0);
  }

  children.forEach((entry) => {
    entry.child.on("exit", async (code, signal) => {
      remaining -= 1;

      if (signal) {
        process.stdout.write(`[${entry.name}] exited by signal ${signal}.\n`);
      } else {
        process.stdout.write(`[${entry.name}] exited with code ${code}.\n`);
      }

      if (!shuttingDown && code && code !== 0) {
        if (entry.name === "backend") {
          const backendNowReachable = await probeBackend();

          if (backendNowReachable) {
            process.stdout.write(
              "[launcher] Backend process exited, but API is already reachable on :5050. Continuing.\n"
            );

            if (remaining === 0) {
              process.exit(0);
            }

            return;
          }
        }

        process.stderr.write(`[launcher] ${entry.name} exited with error. Stopping other services.\n`);
        killAll();
        process.exit(code);
        return;
      }

      if (remaining === 0) {
        process.exit(0);
      }
    });
  });
})();
