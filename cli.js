#!/usr/bin/env node

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

console.log("📌 Cypher.space Template initialization...");

const repo = "https://github.com/cypher-space/V0.9-Beta.git";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

try {
	rl.question("🛠 Enter the project name: ", (targetFolder) => {
		rl.close();

		try {
			console.log(
				"\x1b[36m%s\x1b[0m",
				`🛠 Cloning 'cypher-space' template into ${targetFolder}...`
			);
			execSync(`git clone --depth 1 ${repo} ${targetFolder}`, {
				stdio: "inherit",
			});

			fs.rmSync(path.join(__dirname, targetFolder, ".git"), {
				recursive: true,
			});
		} catch (_) {
			throw "🛑 Unable to clone the template";
		}

		try {
			console.log("\x1b[36m%s\x1b[0m", `🛠 Configuring template...`);
			const currentDir = process.cwd();
			const projectDir = path.resolve(currentDir, targetFolder);
			const projectPackage = require(path.join(projectDir, "package.json"));

			projectPackage.name = targetFolder;
			fs.writeFileSync(
				path.join(projectDir, "package.json"),
				JSON.stringify(projectPackage, null, 2)
			);
		} catch (_) {
			throw "🛑 Unable to configure project's package";
		}

		try {
			console.log(
				"\x1b[36m%s\x1b[0m",
				`🛠 Installing dependencies in ${targetFolder}...`
			);
			execSync("npm install", { cwd: targetFolder, stdio: "inherit" });
		} catch (_) {
			throw "🛑 Unable to install dependencies";
		}

		console.log(
			`\x1b[32m%s\x1b[0m", "✅ Template initialized successfully! \nType \`cd ${targetFolder}\` to open your fresh template ✨`
		);
	});
} catch (err) {
	console.warn(
		"\x1b[31m%s\x1b[0m",
		`🚧 Something went wrong: ${
			typeof err !== "string" ? "Unable resolve the prompt" : err
		}`
	);
}
