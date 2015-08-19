var argParse = require('minimist');

function CommandParser(chatBot) {
	var commandParser = this;
	this.Responses = {};
	this.Commands = {trigger: function(args) {
		if (args['add']) {
			commandParser.Responses[args['name']] = args['response'];
			chatBot.SendMessage("Successfully added the command: " + args['name']);
		} else if (args['delete']) {
			delete commandParser.Responses[args['name']];
			chatBot.SendMessage("Successfully deleted the command: " + args['name']);
		} else if (args['modify']) {
			commandParser.Responses[args['name']] = args['response'];
			chatBot.SendMessage("Successfully editted the command: " + args['name']);
		}
	}};
	this.bootUp = Date.now() / 1000;
	this.chatBot = chatBot;
	
	this.chatBot.on("message", function(message) {
		var params = message['params'];
		if (params.time > commandParser.bootUp) {
			if (params.text.indexOf('!') == 0) {
				var spacer = params.text.indexOf(' ');
				if (spacer > 0) {
					var command = params.text.substr(1, spacer - 1);
					var args = argParse(params.text.substr(spacer + 1).split(' '), {"--": true});
					console.log(command + ": " + args);
					commandParser.HandleCommand({name:command, args: args});
				} else {
					commandParser.HandleCommand({name:params.text.substr(1), args: {}});
				}
			}
		}
	});
};

CommandParser.prototype.HandleCommand = function(command) {
	console.log(this.Responses);
	console.log(this.Commands);
	console.log(command);
	if (this.Responses[command.name]) {
		console.log("Hit a response");
		this.chatBot.SendMessage(this.Responses[command.name]);
	} else if (this.Commands[command.name]) {
		console.log("Hit a command");
		var handler = this.Commands[command.name];
		var args = command.args;
		handler(args);
	} else {
		this.chatBot.SendMessage("That command does not exist: " + command.name);
	}
}

CommandParser.prototype.RegisterCommand = function(command, handler) {
	
}

module.exports = CommandParser;
