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
		const owner = "cypher-space";
		const repoName = "Template";

		/** @type {string | undefined} */
		let projectDir;
		/** @type {{[name:string]: number | string | {[name:string]: any }} | undefined} */
		let projectPackage;
		/** @type {{[name:string]: number | string | {[name:string]: any }} | undefined} */
		let projectSetupConfig;

		console.log(`📌 ${owner} Template initialization...`);
		/** @type {{ name?: string; blog: boolean; store: boolean; lnurl?: string; btcadress?: string; orderwebhook>: string; finance: boolean; albytoken?: string }} */
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
				name: "lnurl",
				message: "🛠  Enter your Lightning LNUrl: ",
			},
			{
				type: "input",
				name: "btcadress",
				message: "🛠  Enter a receiving bitcoin segwit address for your store: ",
			},
			{
				type: "input",
				name: "orderwebhook",
				message: "🛠  Set your order webhook: ",
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
			answers.albytoken =
				(
					await inquirer.prompt([
						{
							type: "input",
							name: "albytoken",
							message: "🛠  Alby token: ",
							default: "",
						},
					])
				).albytoken ?? "";

		projectDir = path.resolve(process.cwd(), answers.name);

		try {
			console.log(
				"\x1b[36m%s\x1b[0m",
				`🛠 Fetching 'cypher-space' template into ${answers.name}...`
			);
			const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/tarball/main`;
			const tmpDir = path.join(__dirname, ".cypher-space-tmp");
			fs.mkdirSync(tmpDir, { recursive: true });
			const tarPath = path.join(tmpDir, "downloaded_repo.tar");
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
			const newDestination = path.join(__dirname, answers.name);

			fs.renameSync(path.join(tmpDir, extractedFolderName), newDestination);
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
			projectSetupConfig.lnurl = answers.lnurl ?? projectSetupConfig.lnurl;
			projectSetupConfig.btcadress =
				answers.btcadress ?? projectSetupConfig.btcadress;
			projectSetupConfig.btcadress =
				answers.btcadress ?? projectSetupConfig.btcadress;
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
			"✅ Template initialized successfully! \nType `cd ${answers.name}` to open your fresh template ✨"
		);
		console.log(
			"\x1b[32m%s\x1b[0m",
			`📌 Don't worry, you can modify those settings at any times in '${answers.name}/config/setup.json'`
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
