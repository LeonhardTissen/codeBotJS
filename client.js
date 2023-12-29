const { Client, GatewayIntentBits, ActivityType } = require("discord.js");

function createClient() {
	// Create a new Discord client
	const client = new Client({
		intents: 131071,
		partials: ['CHANNEL', 'GUILD_MEMBER', 'GUILD_SCHEDULED_EVENT', 'MESSAGE', 'REACTION', 'USER']
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

	return client;
}

exports.createClient = createClient;
