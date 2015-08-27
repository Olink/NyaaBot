var redisClient = require('./redis_client.js');
var Promise = require('bluebird');
var UserStore = require('./user_store.js');

var TriggerStore = function(chat) {
	this.chatBot = chat;
	this.triggers = {};
};

TriggerStore.prototype.Parse = function(data) {
	for (var key in data) {
		var parts = data[key].split('$%')
		var trig = {
			response: parts[0],
			accessLevel: parts[1]
		}
		this.triggers[key] = trig;
	}
}

TriggerStore.prototype.Serialize = function() {
	var data = {};
	for (var key in this.triggers) {
		var str = "";
		var trig = this.triggers[key];
		str += trig.response;
		str += "$%";
		str += trig.accessLevel;
		data[key] = str;
	}
	return data;
}

TriggerStore.prototype.Load = function() {
	var store = this;
	redisClient.hgetall(store.chatBot.channel + ":triggers", function (err, obj) {
		if (!err) {
			if (obj) {
				store.Parse(obj)
			} else {
				store.triggers = {};	
			}
		}
	});
}

TriggerStore.prototype.Save = function() {
	var data = this.Serialize();
	redisClient.HMSET(this.chatBot.channel + ":triggers", data);
}

TriggerStore.prototype.TryExecute = function(username, commandname, args) {
	var user = UserStore.Fetch(username);
	if (user) {
		var trigger = this.triggers[commandname];
		if (trigger) {
			if (user.accessLevel >= trigger.accessLevel) {
				this.chatBot.SendMessage(trigger.response);
			}
		}
	}
}

TriggerStore.prototype.Set = function(commandname, args, accessLevel) {
	var trig = {
		response: args,
		accessLevel: accessLevel
	}
	
	this.triggers[commandname] = trig;
	this.Save();
}

TriggerStore.prototype.TryAdd = function(commandname, args, accessLevel) {
	if (this.triggers[commandname]) {
		return false;
	} else {
		this.Set(commandname, args, accessLevel);
	}
	return true;
}

TriggerStore.prototype.TryDelete = function(commandname, args) {
	if (commandname in this.triggers) {
		delete this.triggers[commandname];
		this.Save();
		return true;
	}
	return false;
}

TriggerStore.prototype.TryModify = function(commandname, args, accessLevel) {
	if (commandname in this.triggers) {
		this.Set(commandname, args, accessLevel);
	} else {
		this.TryAdd(commandname, args);
	}
	return true;
}

module.exports = TriggerStore;
