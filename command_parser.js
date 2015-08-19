var argParse = require('minimist');

function CommandParser(chatBot) {
	this.Commands = {};
	this.chatBot = chatBot;
	this.chatBot.on("message", function(message) {
		var params = message['params'];
		if (params.text.indexOf('!') == 0) {
			var spacer = params.text.indexOf(' ');
			var command = params.text.substr(1, spacer);
			var args = argParse(params.text.substr(spacer + 1).split(' '));
			console.log(command + ": " + args['_'] + "; " + args['--']);
		}
	});
};

CommandParser.prototype.HandleCommand = function(command) {
	if (command.name in this.Commands) {
		var handler = this.Commands[command.name];
		var args = command.args;
		handler(args);
	}
}

CommandParser.prototype.RegisterCommand = function(command, handler) {
	
}

module.exports = CommandParser;
