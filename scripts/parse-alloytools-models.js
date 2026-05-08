#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const checkout = process.env.ALLOYTOOLS_CHECKOUT ||
  path.join(repoRoot, "vendor", "AlloyTools", "org.alloytools.alloy");
const models = path.join(checkout, "org.alloytools.alloy.extra", "extra", "models");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function ensureCheckout() {
  if (!fs.existsSync(path.join(checkout, ".git"))) {
    fs.mkdirSync(path.dirname(checkout), { recursive: true });
    const clone = run("git", [
      "clone",
      "--depth",
      "1",
      "https://github.com/AlloyTools/org.alloytools.alloy",
      checkout,
    ]);

    if (clone.status !== 0) {
      process.exit(clone.status);
    }

    return;
  }

  const pull = run("git", ["-C", checkout, "pull", "--ff-only"]);
  if (pull.status !== 0) {
    process.exit(pull.status);
  }
}

function collectAlloyFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectAlloyFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".als")) {
      files.push(fullPath);
    }
  }

  return files;
}

ensureCheckout();

if (!fs.existsSync(models)) {
  console.error(`AlloyTools model directory not found: ${models}`);
  process.exit(1);
}

let failed = false;

for (const model of collectAlloyFiles(models)) {
  const parse = run("tree-sitter", ["parse", "--quiet", "--stat", model], {
    capture: true,
  });
  const output = `${parse.stdout || ""}${parse.stderr || ""}`;

  if (parse.status !== 0 || output.includes("ERROR")) {
    console.error(`Parse errors in ${model}`);
    process.stderr.write(output);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
