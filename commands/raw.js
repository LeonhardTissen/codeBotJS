const { db } = require("../db");

function raw(args, channel) {
	/*
	Viewing the raw source code of any stored function
	*/
	const [functionName] = args;
	
	db.get('SELECT code FROM functions WHERE name = ?', [functionName], (err, row) => {
		if (err) {
			return channel.send(`Error retrieving function: ${err.message}`);
		}
		if (!row) {
			return channel.send(`Function '${functionName}' not found.`);
		}
		
		const fullCode = `Here's the code of \`${functionName}\`:\n\`\`\`js\n${row.code}\`\`\``;
		const debugLink = `[Debug and edit faster here](https://code.warze.org?function=${functionName})`;
		const fullMessage = `${fullCode}\n${debugLink}`;
		if (fullMessage.length > 2000) {
			return channel.send(`The code for this function is too long to send, but you can still view and edit it here:\n${debugLink}`);
		} else {
			channel.send(`${fullCode}${debugLink}`);
		}
	});
}
exports.raw = raw;
