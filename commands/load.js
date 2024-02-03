const { db } = require("../db");
const { VM } = require("vm2");
const { Canvas, loadImage, createCanvas } = require("canvas");
const { sendImages } = require("../sendimages");
const fetch = require("node-fetch");

function load(args, channel) {
	/*
	Loading and executing a function
	*/
	const [functionName, ...parameters] = args;

	db.get('SELECT code FROM functions WHERE name = ?', [functionName], (err, row) => {
		if (err) {
			return channel.send(`Error retrieving function: ${err.message}`);
		}
		if (!row) {
			return channel.send(`Function '${functionName}' not found.`);
		}

		const inp_text = parameters.join(' ');
		// Define the variable "inp" as the inputted text before the code.
		const sandboxed_code = `let inp = "${inp_text}"; ${row.code}`;

		// An array for storing the console.log messages the code produces.
		const out_messages = [];

		// An array for storing the canvas images the code produces.
		const out_images = [];

		let gif_speed = 100;
		let may_take_longer = false;
		let has_fetched = false;

		const sandbox = new VM({
			timeout: 3500,
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
				gifspeed: (ms) => {
					gif_speed = ms;
				},
				fetch: (url) => {
					if (has_fetched) return;
					has_fetched = true;
					console.log('Fetching', url);
					return fetch(url);
				}
			},
		});

		try {
			// Run the sandboxed code
			sandbox.run(sandboxed_code);

			// Combine the output messages from the code
			const combined_messages = out_messages.join('\n');

			// Send them to the Discord if there are any
			if (combined_messages !== '') {
				if (combined_messages.length > 2000) {
					channel.send(`Message too long (${combined_messages.length} > 2000)`)
				} else {
					channel.send(combined_messages);
				}
			}

			if (may_take_longer) {
				setTimeout(() => {
					sendImages(out_images, channel, gif_speed);
				}, 2000);
			} else {
				sendImages(out_images, channel, gif_speed);
			}
			
		} catch (error) {
			// The program ran into an error while executing
			channel.send(`Error occured:\n\`\`\`${error}\`\`\``);
		}
	});
}
exports.load = load;
