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

		if (!message.content.startsWith('-')) return;

		const content = message.content.slice(1);
	
		const [command, ...args] = content.replace('\n', ' ').split(' ');
	
		switch (command) {
			case 'save':
				save(args, message.channel, content, command);
				break;
			case 'raw':
				raw(args, message.channel);
				break;
			case 'load':
				load(args, message.channel);
				break;
			case 'list':
				list(message.channel);
				break;
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
