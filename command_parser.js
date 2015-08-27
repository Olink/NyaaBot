var TriggerStore = require('./trigger_store.js')
var UserStore = require('./user_store.js');

function CommandParser(chatBot) {
	var commandParser = this;
	this.chatBot = chatBot;
	this.Commands = {}
	this.Responses = new TriggerStore(chatBot);
	this.Responses.Load();
	commandParser.Commands = {
		"trigger": {
			handler: function(args) {
				if (args.length < 2) {
					commandParser.chatBot.SendMessage(commandParser.Commands['trigger'].usage);
					return;
				}
				
				var action = args[0];
				var name = args[1];
				
				if (name in commandParser.Commands) {
					commandParser.chatBot.SendMessage("That is a reserved command name.");
					return;
				}
				
				if (action === 'add') {
					if (args.length < 4) {
						commandParser.chatBot.SendMessage(commandParser.Commands['trigger'].usage);
						return;
					}
					
					var accessLevel = args[2];
					var args = args.slice(3).join(' ');
					if (commandParser.Responses.TryAdd(name, args, accessLevel)) {
						commandParser.chatBot.SendMessage("Successfully added trigger.");
					} else {
						commandParser.chatBot.SendMessage("Trigger already exists.");
					}
				} else if (action === 'modify') {
					if (args.length < 4) {
						commandParser.chatBot.SendMessage(commandParser.Commands['trigger'].usage);
						return;
					}
					
					var accessLevel = args[2];
					var args = args.slice(3).join(' ');
					if (commandParser.Responses.TryModify(name, args, accessLevel)) {
						commandParser.chatBot.SendMessage("Successfully modified trigger.");
					}
				} else if (action === 'delete') {
					if (commandParser.Responses.TryDelete(name)) {
						commandParser.chatBot.SendMessage("Successfully deleted trigger.");
					} else {
						commandParser.chatBot.SendMessage("Trigger does not exist.");
					}
				} else {
					commandParser.chatBot.SendMessage(commandParser.Commands['trigger'].usage);
				}
			},
			accessLevel: 2,
			usage: "!trigger [add|modify|delete] [name] [accessLevel] [args]"
		},
		"timer": {
			handler: function(args) {
				commandParser.chatBot.SendMessage("This feature is currently in development.");
			},
			accessLevel: 2,
			usage: "!timer [add|modify|delete] [how long this should run for] [interval between messages] [message]"
		},
		"help": {
			handler: function(args) {
				for (var key in commandParser.Commands) {
					if (key === "help") {
						continue;
					}
					var command = commandParser.Commands[key];
					commandParser.chatBot.SendMessage(command.usage);
				}
			},
			accessLevel: 2,
			usage: "!help"
		}
	};
	
	commandParser.TryExecute = function(username, commandname, args) {
		var user = UserStore.Fetch(username);
		if (user) {
			var command = commandParser.Commands[commandname];
			if (command) {
				if (user.accessLevel >= command.accessLevel) {
					command.handler(args);
				} else {
					commandParser.chatBot.SendMessage("You do not have permission to do this.");
				}
			}
		}
	}

	commandParser.checkCommand = function(user, command, args) {
		if (commandParser.Commands[command]) {
			commandParser.TryExecute(user, command, args);
		} else {
			commandParser.Responses.TryExecute(user, command, args);
		}
	};
	
	commandParser.chatBot.on("message", function(message) {
		var params = message['params'];
		if (!params['buffer']) {
			if (params.text.indexOf('!') == 0) {
				var spacer = params.text.indexOf(' ');
				if (spacer > 0) {
					var command = params.text.substr(1, spacer - 1);
					var args = params.text.substr(spacer + 1).split(' ');
					commandParser.checkCommand(message['params']['name'], command, args);
				} else {
					commandParser.checkCommand(message['params']['name'], params.text.substr(1), []);
				}
			}
		}
	});
};

module.exports = CommandParser;
