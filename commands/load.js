const { db } = require("../db");
const { VM } = require("vm2");
const { Canvas, loadImage, createCanvas } = require("canvas");
const { sendImages } = require("../sendimages");
const fetch = require("node-fetch");

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function load(args, message) {
	/*
	Loading and executing a function
	*/
	const [functionName, ...parameters] = args;
	const channel = message.channel;

	db.get('SELECT code FROM functions WHERE name = ?', [functionName], async (err, row) => {
		if (err) {
			return channel.send(`Error retrieving function: ${err.message}`);
		}
		if (!row) {
			return channel.send(`Function '${functionName}' not found.`);
		}

		const inp_text = parameters.join(' ');
		// Define the variable "inp" as the inputted text before the code.
		const sandboxed_code = `
let inp = "${inp_text}";
(async () => {
	${row.code}
})()`;

		// An array for storing the console.log messages the code produces.
		const out_messages = [];

		// An array for storing the canvas images the code produces.
		const out_images = [];

		let gif_speed = 100;
		let may_take_longer = false;

		const sandbox = new VM({
			timeout: 20000,
			sandbox: {
				console: {
					// Store any logged messages and send to the Discord at the end of execution
					log: (...logArgs) => {
						out_messages.push(logArgs.join(' '));
					},
					// An interface to post a canvas to the Discord channel
					post: (cvs) => {
						// Save contents to a buffer
						const bcvs = new Canvas(cvs.width, cvs.height);
						const bctx = bcvs.getContext('2d');
						bctx.drawImage(cvs, 0, 0, cvs.width, cvs.height);
						out_images.push(bcvs);
					},
				},
				// Since vm2 doesn't have these by default, have an easy interface for creating a canvas
				canvas: (width, height) => {
					const cvs = createCanvas(width, height);
					const ctx = cvs.getContext('2d');
					return [cvs, ctx];
				},
				image: async (src) => {
					may_take_longer = true;
					try {
						return await loadImage(src);
					} catch (err) {}
				},
				getMessage: () => {
					return message;
				},
				json: async (url) => {
					may_take_longer = true;
					try {
						const res = await fetch(url, {
							headers: new Headers({
								'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

							})
						});
						return await res.json();
					} catch (err) {}
				},
				gifspeed: (ms) => {
					gif_speed = ms;
				},
			},
		});

		try {
			// Run the sandboxed code
			sandbox.run(sandboxed_code);

			if (may_take_longer) {
				while (out_images.length === 0 && out_messages.length === 0) {
					console.log('Waiting for output...');
					await sleep(100);
				}
			}

			// Combine the output messages from the code
			const combined_messages = out_messages.join('\n');

			// Send them to the Discord if there are any
			if (combined_messages !== '') {
				if (combined_messages.length > 2000) {
					// Split the message into chunks of 2000 characters
					const chunks = combined_messages.match(/[\s\S]{1,2000}/g);
					for (const chunk of chunks) {
						channel.send(chunk);
					}
				} else {
					channel.send(combined_messages);
				}
			}

			sendImages(out_images, channel, gif_speed);
			
		} catch (error) {
			// The program ran into an error while executing
			channel.send(`Error occured:\n\`\`\`${error}\`\`\``);
		}
	});
}
exports.load = load;
