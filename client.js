const { Client, GatewayIntentBits, Partials } = require("discord.js");

function createClient() {
	// Create a new Discord client
	const client = new Client({
		intents: Object.values(GatewayIntentBits),
		partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
	});
	
	// Set up the bot's ready event
	client.once('ready', () => {
		console.log(`Logged in as ${client.user.tag}!`);
	});

	return client;
}

exports.createClient = createClient;
