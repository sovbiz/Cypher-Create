#!/usr/bin/env node

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");

/** Git repo source source. */
const source = "https://github.com/cypher-space/V0.9-Beta.git";

const init = async () => {
	try {
		console.log("📌 Cypher.space Template initialization...");
		/** @type {{ name: string; blog: boolean; store: boolean; lnurl: string; btcadress: string; finance: boolean; albytoken: boolean, albytoken?: string }} */
		const answers = await inquirer.prompt([
			{
				type: "input",
				name: "name",
				message: "🛠  What is the name of your project: ",
				default: "cypher.space",
			},
			{
				type: "confirm",
				name: "blog",
				message: "🛠  Do you want to enable a blog: ",
				default: true,
			},
			{
				type: "confirm",
				name: "store",
				message: "🛠  Do you want to enable a store: ",
				default: true,
			},
			{
				type: "input",
				name: "lnurl",
				message: "🛠  Enter your Lightning LNUrl: ",
				default: "",
			},
			{
				type: "input",
				name: "btcadress",
				message: "🛠  Enter a receiving bitcoin segwit address for your store: ",
				default: "",
			},
			{
				type: "confirm",
				name: "finance",
				message:
					"🛠  Do you want to enable an open finance (experimental alby only): ",
				default: false,
			},
		]);

		if (answers.finance)
			answers.albytoken = await inquirer.prompt([
				{
					type: "input",
					name: "albytoken",
					message: "🛠  Alby token: ",
					default: "",
				},
			]);

		try {
			console.log(
				"\x1b[36m%s\x1b[0m",
				`🛠 Cloning 'cypher-space' template into ${answers.name}...`
			);
			execSync(`git clone --depth 1 ${source} ${answers.name}`, {
				stdio: "inherit",
			});

			fs.rmSync(path.join(__dirname, answers.name, ".git"), {
				recursive: true,
			});
		} catch (_) {
			throw "🛑 Unable to clone the template";
		}

		try {
			console.log("\x1b[36m%s\x1b[0m", `🛠 Configuring template...`);
			const projectDir = path.resolve(process.cwd(), answers.name);
			const projectPackage = require(path.join(projectDir, "package.json"));
			const projectSetupConfig = require(path.join(
				projectDir,
				"config/setup.json"
			));

			projectPackage.name = answers.name;

			projectSetupConfig.name = answers.name;
			projectSetupConfig.blog = answers.blog;
			projectSetupConfig.shop = answers.shop;
			projectSetupConfig.lnurl = answers.lnurl;
			projectSetupConfig.btcadress = answers.btcadress;
			projectSetupConfig.finance = answers.finance;
			if (answers.albytoken) projectSetupConfig.albytoken = answers.albytoken;

			fs.writeFileSync(
				path.join(projectDir, "package.json"),
				JSON.stringify(projectPackage, null, 2)
			);
			fs.writeFileSync(
				path.join(projectDir, "config/setup.json"),
				JSON.stringify(projectSetupConfig, null, 2)
			);
		} catch (_) {
			throw "🛑 Unable to configure project's package";
		}

		try {
			console.log(
				"\x1b[36m%s\x1b[0m",
				`🛠 Installing dependencies in ${answers.name}...`
			);
			execSync("npm install", { cwd: answers.name, stdio: "inherit" });
		} catch (_) {
			throw "🛑 Unable to install dependencies";
		}

		console.log(
			"\x1b[32m%s\x1b[0m",
			"✅ Template initialized successfully! \nType `cd ${answers.name}` to open your fresh template ✨"
		);
		console.log(
			"\x1b[32m%s\x1b[0m",
			"📌 Don't worry, you can modify those settings any time in `projectName/config/setup.json`"
		);
	} catch (err) {
		console.warn(
			"\x1b[31m%s\x1b[0m",
			`🚧 Something went wrong: ${
				typeof err !== "string" ? "Unable resolve the prompt" : err
			}`
		);
	}
};

init();
