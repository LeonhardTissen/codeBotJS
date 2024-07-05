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

		let msg = 'List of available functions:\n';
		while (rows.length > 0) {
			while (msg.length < 2000) {
				const row = rows.shift();
				msg += ` \`${row.name}\``;
			}
			channel.send(msg);
			msg = '';
		}
	});
}

exports.list = list;
