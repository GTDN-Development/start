const path = require("node:path");
const { createRequire } = require("node:module");

const projectRoot = path.resolve(__dirname, "..");
const testRequire = createRequire(__filename);
const { loadEnvConfig } = testRequire("@next/env");

let isTestEnvLoaded = false;

function getProjectRoot() {
  return projectRoot;
}

function loadTestEnv() {
  if (isTestEnvLoaded) {
    return process.env;
  }

  const previousNodeEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = "test";
  loadEnvConfig(projectRoot, false);

  if (previousNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = previousNodeEnv;
  }

  isTestEnvLoaded = true;

  return process.env;
}

module.exports = {
  getProjectRoot,
  loadTestEnv,
};
