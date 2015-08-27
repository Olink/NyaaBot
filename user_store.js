var Cabinet = function() {
	this.users = {}
};

Cabinet.prototype.Fetch = function(name) {
	if (name in this.users) {
		return this.users[name];
	}
	return null;
}

Cabinet.prototype.Store = function(obj) {
	var name = obj['name'];
	this.users[name] = {};
	this.users[name].name = name;
	switch (obj['role']) {
		case "anon": {
			this.users[name].accessLevel = 1;
		}
		break;
		case "user": {
			this.users[name].accessLevel = 2;
		}
		break;
		case "admin": {
			this.users[name].accessLevel = 3;
		}
		break;
		case "guest": {
			this.users[name].accessLevel = 0;
		}
		break;
		default: {
			this.users[name].accessLevel = 0;
		}
		break;
	}
}

var cabinet = new Cabinet();

module.exports = cabinet;
