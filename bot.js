const { Client, GatewayIntentBits } = require('discord.js');
const { VM } = require('vm2');

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

// Set up the message event
client.on('messageCreate', (message) => {
	// Ignore messages from bots
	if (message.author.bot) return;

	// Check if the message starts with a command prefix
	if (message.content.startsWith('!sandbox')) {
		// Extract the code to be executed
		const code = message.content.slice('!sandbox'.length).trim().replace('```js','').replace('```','');

		const out_messages = [];

		// Create a new virtual machine instance for sandboxing
		const sandbox = new VM({
			timeout: 1000, // Set a timeout for code execution (in milliseconds)
			sandbox: {
				console: {
					log: (...args) => {
						out_messages.push(args.join(' ')); // Send the logged message to the channel
					},
				},
			},
		});

		try {
			// Run the code in the sandbox
			sandbox.run(code);

			message.channel.send(out_messages.join('\n'));
		} catch (error) {
			// Send any errors that occurred during execution
			message.channel.send(`Error:\n\`\`\`${error}\`\`\``);
		}
	}
});

// Log in to Discord with the bot's token
client.login(token);
