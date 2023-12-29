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
		
		channel.send(`Here's the code of \`${functionName}\`:\n\`\`\`js\n${row.code}\`\`\`[Debug and edit faster here](https://code.warze.org?function=${functionName})`);
	});
}
exports.raw = raw;
