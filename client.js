const { Client, GatewayIntentBits, ActivityType, Partials } = require("discord.js");

function createClient() {
	// Create a new Discord client
	const client = new Client({
		intents: Object.values(GatewayIntentBits),
		partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
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
