import { execFileSync } from "node:child_process";

const revision = process.env.DEPLOYMENT_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/i.test(revision)) throw new Error("DEPLOYMENT_SHA must be a full Git commit SHA.");
execFileSync("node_modules/.bin/wrangler", ["deploy", "--var", `DEPLOYMENT_SHA:${revision}`], { stdio: "inherit" });
