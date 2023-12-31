const { token } = require('./token');
const { db } = require('./db');
const { createClient } = require('./client');

const { save } = require('./commands/save');
const { raw } = require('./commands/raw');
const { load } = require('./commands/load');
const { list } = require('./commands/list');

function startBot() {
	const client = createClient();
	// Set up the message event
	client.on('messageCreate', (message) => {
		if (message.author.bot) return;
	
		const [command, ...args] = message.content.replace('\n', ' ').split(' ');
	
		if (command === '-save') {
			save(args, message.channel, message.content, command);
		} else if (command === '-raw') {
			raw(args, message.channel);
		} else if (command === '-load') {
			load(args, message.channel);
		} else if (command === '-list') {
			list(message.channel);
		}
	});
	
	// Log in to Discord with the bot's token
	client.login(token);
	
	// Close the database connection when not in use
	process.on('exit', () => {
		client.destroy();
		db.close();
	});

	return client;
}
exports.startBot = startBot;
