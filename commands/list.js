const { db } = require("../db");

function list(channel) {
	/*
	Returns a list of all created functions
	*/
	db.all('SELECT name FROM functions', (err, rows) => {
		if (err) {
			return channel.send(`Error retrieving function list: ${err.message}`);
		}
		
		if (rows.length === 0) {
			return channel.send('No functions found.');
		}

		const functionNames = rows.map(row => `\`${row.name}\``).join(', ');
		channel.send(`List of available functions:\n${functionNames}`);
	});
}

exports.list = list;
