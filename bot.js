const { Client, GatewayIntentBits } = require('discord.js');
const { VM } = require('vm2');
const { Database } = require('sqlite3');

const { token } = require('./token')

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
});

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
		
		if (args.length < 1) {
			message.channel.send('You need to provide a command name');
			return;
		}

		const raw_code = message.content.replace(command, '').replace(args[0], '')
		const code = raw_code.replace('```js', '').replace('```', '');

		const cmd_name = args[0].toLowerCase();

		let msg = `Your command \`${cmd_name}\` has been saved.`;

		db.run('INSERT INTO functions (name, code) VALUES (?, ?)', [cmd_name, code], (err) => {
			if (err) {
				if (err.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
					message.channel.send(`A function with the name \`${cmd_name}\` already exists.`);
				} else {
					message.channel.send(`Something unexpected happened: ${err.message}`);
				}
				return;
			}
			message.channel.send(msg);
		});
    } else if (command === '-load') {
        const [functionName, ...parameters] = args;

        db.get('SELECT code FROM functions WHERE name = ?', [functionName], (err, row) => {
            if (err) {
                return message.channel.send(`Error retrieving function: ${err.message}`);
            }
            if (!row) {
                return message.channel.send(`Function '${functionName}' not found.`);
            }

			const inp_text = parameters.join(' ');
            const sandboxed_code = `let inp = "${inp_text}"; ${row.code}`;
			console.log(sandboxed_code);
            const out_messages = [];

            const sandbox = new VM({
                timeout: 1000,
                sandbox: {
                    console: {
                        log: (...logArgs) => {
                            out_messages.push(logArgs.join(' '));
                        },
                    },
                },
            });

            try {
                sandbox.run(sandboxed_code);
                message.channel.send(out_messages.join('\n'));
            } catch (error) {
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
