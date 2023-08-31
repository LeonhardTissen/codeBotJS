const { Client, GatewayIntentBits, ActivityType, AttachmentBuilder } = require('discord.js');
const { VM } = require('vm2');
const { Database } = require('sqlite3');
const { createCanvas } = require('canvas');

// Load token string from another file
const { token } = require('./token');

// Create a new Discord client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
	],
});

// Set up the bot's ready event
client.once('ready', () => {
	console.log('Bot is ready');
	client.user.setPresence({ 
		activities: [{ 
			name: 'Warze.org/cmd', 
			type: ActivityType.Listening,
		}], 
		status: 'online' 
	});
});

// Load the functions.db database
const db = new Database('functions.db');

// Create a table to store functions if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS functions (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL
    )`);
});

// Set up the message event
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const [command, ...args] = message.content.replace('\n', ' ').split(' ');

    if (command === '-save') {
		/*
		Store a new function or overwrite existing code
		*/
		if (args.length < 1) {
			message.channel.send('You need to provide a command name');
			return;
		}

		const raw_code = message.content.replace(command, '').replace(args[0], '')
		const code = raw_code.replace('```js', '').replace('```', '');

		const cmd_name = args[0].toLowerCase();

		db.get('SELECT code FROM functions WHERE name = ?', [cmd_name], (err, row) => {
			if (err) {
				message.channel.send(`Error checking existing function: ${err.message}`);
				return;
			}
		
			if (row) {
				// There is existing code under that function name, replace it and display the old code
				const previousCode = row.code;
				db.run('UPDATE functions SET code = ? WHERE name = ?', [code, cmd_name], (updateErr) => {
					if (updateErr) {
						message.channel.send(`Error updating function: ${updateErr.message}`);
						return;
					}
					message.channel.send(`:warning: Function \`${cmd_name}\` has been updated.\nPrevious code:\n\`\`\`js\n${previousCode}\`\`\``);
				});
			} else {
				// A new function is created, insert it into the database
				db.run('INSERT INTO functions (name, code) VALUES (?, ?)', [cmd_name, code], (insertErr) => {
					if (insertErr) {
						message.channel.send(`Something unexpected happened: ${insertErr.message}`);
						return;
					}
					message.channel.send(`Function \`${cmd_name}\` has been saved.`);
				});
			}
		});
	} else if (command === '-raw') {
		/*
		Viewing the raw source code of any stored function
		*/
		const [functionName] = args;
		
		db.get('SELECT code FROM functions WHERE name = ?', [functionName], (err, row) => {
            if (err) {
                return message.channel.send(`Error retrieving function: ${err.message}`);
            }
            if (!row) {
                return message.channel.send(`Function '${functionName}' not found.`);
            }

			message.channel.send(`Here's the code of \`${functionName}\`:\n\`\`\`js\n${row.code}\`\`\``);
		});
    } else if (command === '-load') {
		/*
		Loading and executing a function
		*/
        const [functionName, ...parameters] = args;

        db.get('SELECT code FROM functions WHERE name = ?', [functionName], (err, row) => {
            if (err) {
                return message.channel.send(`Error retrieving function: ${err.message}`);
            }
            if (!row) {
                return message.channel.send(`Function '${functionName}' not found.`);
            }

			const inp_text = parameters.join(' ');
			// Define the variable "inp" as the inputted text before the code.
            const sandboxed_code = `let inp = "${inp_text}"; ${row.code}`;

			// An array for storing the console.log message the code produce.
            const out_messages = [];

            const sandbox = new VM({
                timeout: 1000,
                sandbox: {
                    console: {
						// Store any logged messages and send to the Discord at the end of execution
                        log: (...logArgs) => {
                            out_messages.push(logArgs.join(' '));
                        },
						// An interface to post a canvas to the Discord channel
						post: (cvs) => {
							message.channel.send({ 
								files: [
									new AttachmentBuilder(cvs.toBuffer(), {name: 'image.png'})
								] 
							});
						}
                    },
					// Since vm2 doesn't have these by default, have an easy interface for creating a canvas
					canvas: (width, height) => {
						const cvs = createCanvas(width, height);
						const ctx = cvs.getContext('2d');
						return [cvs, ctx];
					},
					image: (src) => {
						const img = new Image();
						img.src = src;
						return img;
					},
                },
            });

            try {
				// Run the sandboxed code
                sandbox.run(sandboxed_code);

				// Combine the output messages from the code
				const combined_messages = out_messages.join('\n');

				// Send them to the Discord if there are any
				if (combined_messages !== '') {
					message.channel.send(combined_messages);
				}
            } catch (error) {
				// The program ran into an error while executing
                message.channel.send(`Error:\n\`\`\`${error}\`\`\``);
            }
        });
    }
});

// Log in to Discord with the bot's token
client.login(token);

// Close the database connection when not in use
process.on('exit', () => {
    db.close();
});
