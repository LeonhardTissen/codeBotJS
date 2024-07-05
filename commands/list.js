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
			while (msg.length < 2000 && rows.length > 0) {
				const row = rows[0];
				const newMsg = msg + ` \`${row.name}\``;
				
				if (newMsg.length > 2000) {
					break; // Exit the loop if adding this function name exceeds the limit
				}
				
				msg = newMsg;
				rows.shift();
			}
			channel.send(msg);
			msg = '';
		}
	});
}

exports.list = list;
