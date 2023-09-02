const { db } = require("../db");

function save(args, channel, content, command) {
	/*
	Store a new function or overwrite existing code
	*/
	if (args.length < 1) {
		channel.send('You need to provide a command name');
		return;
	}

	const raw_code = content.replace(command, '').replace(args[0], '')
	const code = raw_code.replace('```js', '').replace('```', '');

	const cmd_name = args[0].toLowerCase();

	db.get('SELECT code FROM functions WHERE name = ?', [cmd_name], (err, row) => {
		if (err) {
			channel.send(`Error checking existing function: ${err.message}`);
			return;
		}
	
		if (row) {
			// There is existing code under that function name, replace it and display the old code
			const previousCode = row.code;
			db.run('UPDATE functions SET code = ? WHERE name = ?', [code, cmd_name], (updateErr) => {
				if (updateErr) {
					channel.send(`Error updating function: ${updateErr.message}`);
					return;
				}
				try {
					channel.send(`:warning: Function \`${cmd_name}\` has been updated.\nPrevious code:\n\`\`\`js\n${previousCode}\`\`\``);
				} catch (err) {
					channel.send("Previous code too long. I'll find a fix later.");
				}
			});
		} else {
			// A new function is created, insert it into the database
			db.run('INSERT INTO functions (name, code) VALUES (?, ?)', [cmd_name, code], (insertErr) => {
				if (insertErr) {
					channel.send(`Something unexpected happened: ${insertErr.message}`);
					return;
				}
				channel.send(`Function \`${cmd_name}\` has been saved.`);
			});
		}
	});
}
exports.save = save;
