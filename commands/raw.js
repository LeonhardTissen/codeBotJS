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
		
		try {
			channel.send(`Here's the code of \`${functionName}\`:\n\`\`\`js\n${row.code}\`\`\``);
		} catch (err) {
			channel.send("Code too long. I'll find a fix later.");
		}
	});
}
exports.raw = raw;
