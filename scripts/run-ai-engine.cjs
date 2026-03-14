const { spawn } = require("node:child_process");
const path = require("node:path");

const rootCwd = path.resolve(__dirname, "..");
const aiCwd = path.join(rootCwd, "ai-engine");
const isWindows = process.platform === "win32";

const candidates = process.env.PYTHON_CMD
  ? [process.env.PYTHON_CMD]
  : isWindows
    ? ["python", "py -3", "python3"]
    : ["python3", "python"];

const commandNotFoundCodes = new Set([127, 9009]);

const runCandidate = (index) => {
  if (index >= candidates.length) {
    process.stderr.write(
      "[ai-engine] Could not find a working Python command. Set PYTHON_CMD and retry.\n"
    );
    process.exit(1);
  }

  const pythonCommand = candidates[index];
  const fullCommand = `${pythonCommand} run.py`;

  process.stdout.write(`[ai-engine] Starting with: ${pythonCommand}\n`);

  const child = spawn(fullCommand, {
    cwd: aiCwd,
    env: process.env,
    shell: true,
    stdio: "inherit",
    windowsHide: false
  });

  child.on("exit", (code) => {
    if (commandNotFoundCodes.has(Number(code))) {
      process.stderr.write(`[ai-engine] Command failed: ${pythonCommand}. Trying next...\n`);
      runCandidate(index + 1);
      return;
    }

    process.exit(Number.isFinite(code) ? code : 0);
  });

  child.on("error", () => {
    process.stderr.write(`[ai-engine] Failed to spawn command: ${pythonCommand}. Trying next...\n`);
    runCandidate(index + 1);
  });
};

runCandidate(0);
