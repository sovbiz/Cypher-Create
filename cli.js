#!/usr/bin/env node

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const tar = require("tar");
const { promisify } = require("util");
const { pipeline } = require("stream");
const pipelineAsync = promisify(pipeline);

const init = async () => {
	try {
		// DATA
		const owner = "sovbiz";
		const repoName = "Cypher-Nostr-Edition";
		const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/tarball/main`;
		const tmpDir = path.join(__dirname, `${owner}_tmp`);
		const tarPath = path.join(tmpDir, "template.tar");

		/** @type {string | undefined} */
		let projectDir;
		/** @type {{[name:string]: number | string | {[name:string]: any }} | undefined} */
		let projectPackage;
		/** @type {{[name:string]: number | string | {[name:string]: any }} | undefined} */
		let projectSetupConfig;

		console.log(`📌 ${owner} Template initialization... please have your Npub ready !`);
		/** @type {{ name?: string; blog: boolean; store: boolean; nostradmin?: string; btcadress?: string; orderwebhook>: string; finance: boolean; albytoken?: string }} */
		const answers = await inquirer.prompt([
			{
				type: "input",
				name: "name",
				message: "🛠  What is the name of your project: ",
				default: owner,
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
				name: "nostradmin",
				message: "🛠  Enter your Npub ",
			},
			{
				type: "input",
				name: "orderwebhook",
				message: "🛠  Set your order webhook (discord): ",
			},
		]);

		projectDir = path.resolve(process.cwd(), answers.name);

		try {
			console.log(
				"\x1b[36m%s\x1b[0m",
				`🛠 Fetching 'cypher-space' template into ${answers.name}...`
			);

			fs.mkdirSync(tmpDir, { recursive: true });
			const response = await fetch(apiUrl, {
				headers: {
					"User-Agent": "cypher-space",
					Accept: "application/vnd.github.v3.raw",
				},
			});

			if (!response.ok)
				throw `🛑 Failed to fetch repository. Status code: ${response.status}`;

			await pipelineAsync(response.body, fs.createWriteStream(tarPath));
			await tar.extract({
				file: tarPath,
				cwd: tmpDir,
				sync: true,
			});
			fs.unlinkSync(tarPath);

			const extractedFolderName = fs.readdirSync(tmpDir)[0];

			fs.renameSync(path.join(tmpDir, extractedFolderName), projectDir);
			fs.rmSync(tmpDir, { recursive: true });
		} catch (_) {
			console.log(_);
			throw typeof _ === "string" ? _ : "🛑 Unable to install the template";
		}

		try {
			projectPackage = require(path.join(projectDir, "package.json"));
			projectSetupConfig = require(path.join(projectDir, "config/setup.json"));

			if (!projectDir || !projectPackage || !projectSetupConfig)
				throw new Error();
		} catch (_) {
			throw "🛑 Unable to load metadata";
		}

		try {
			console.log("\x1b[36m%s\x1b[0m", `🛠 Configuring template...`);
			projectPackage.name = answers.name;

			projectSetupConfig.name = answers.name ?? projectSetupConfig.name;
			projectSetupConfig.textlogo = answers.name ?? projectSetupConfig.name;
			projectSetupConfig.blog = answers.blog ?? projectSetupConfig.blog;
			projectSetupConfig.shop = answers.shop ?? projectSetupConfig.shop;
			projectSetupConfig.nostradmin = answers.nostradmin ?? projectSetupConfig.nostradmin;
			projectSetupConfig.finance =
				answers.finance ?? projectSetupConfig.finance;
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
			`✅ Template initialized successfully! \nType 'cd ${answers.name}' to go into your new template and \nType 'npm run dev' ✨`
		);
		console.log(
			"\x1b[32m%s\x1b[0m",
			`📌 You can modify settings at any times in '${answers.name}/config/setup.json'`
		);
	} catch (err) {
		try {
			fs.unlinkSync(tarPath);
		} catch (_) {}

		try {
			fs.rmSync(tmpDir, { recursive: true });
		} catch (_) {}

		console.warn(
			"\x1b[31m%s\x1b[0m",
			`🚧 Something went wrong: ${
				typeof err !== "string" ? "🛑 Unable resolve the prompt" : err
			}`
		);
	}
};

init();
