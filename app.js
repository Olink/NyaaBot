console.log(process.env.USERNAME);
console.log(process.env.PASSWORD);
require('datejs');
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var Client = require('./hitbox/client_api.js');
var client = new Client(process.env.USERNAME, process.env.PASSWORD);

var ChatAPI = require('./hitbox/chat_api.js');

client.Login().then(function() {
  console.log("Logged in: " + client.authToken);
  var chatAPI = new ChatAPI(client, "fayzuru");
  chatAPI.on("message", handleMessage);
  chatAPI.on("join", handleJoin);
  rl.on('line', function(line) {
   var message = {
     color: "0xff0000",
     text: line
   };
   chatAPI.SendMessage(message);
});
  chatAPI.JoinServer();
}, function() {
  console.log("Failed to login to the hitbox api.");
}).catch(function(e) {
  console.log(e);
});

function handleMessage(message) {
  var params = message['params'];
  //console.log(params);

  var date = new Date(params.time * 1000);
  console.log(date.toString("HH:mm") + ": [" + params.name + "] " + params.text );
}

function handleJoin(message) {
  console.log(message);
}
