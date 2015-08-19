var WebSocket = require('ws');
var request = require('request');
var Promise = require('bluebird');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
Promise.promisifyAll(request);

function ChatAPI(client, channel, color) {
  this.client = client;
  this.channel = channel;
  this.color = color;
  this.websocket = null;
  EventEmitter.call(this);
};

util.inherits(ChatAPI, EventEmitter);

ChatAPI.prototype.JoinServer = function() {
  var client = this.client;
  var chat = this;
  client.FetchSocketServers().then(function(list) {
    //console.log(list);
    var url = list[0]['server_ip'];
    request.getAsync('http://' + url + '/socket.io/1/').spread(function (resp, body) {
      var token = body;
      var connection = token.split(':')[0];
      //console.log(connection)
      var ws = new WebSocket("ws://" + url + "/socket.io/1/websocket/" + connection);
      chat.websocket = ws;
      
      ws.on('message', function(message) {
        if (message.lastIndexOf('2::', 0) === 0) {
          ws.send('2::');
          console.log('PONG Sent\r\n');
        }
        else if (message.lastIndexOf('1::', 0) === 0) {
          console.log("received 1::")
          var loginCommand = {
            name: "message",
            args: [{
              method: "joinChannel",
              params: {
                channel: chat.channel,
                name: client.username,
                token: client.authToken,
                isAdmin: false
              }
            }]
          }
          var payload = "5:::" + JSON.stringify(loginCommand);
          ws.send(payload);
        } else if (message.lastIndexOf('5:::', 0) === 0) {
          var payload = message.substr(message.indexOf('5:::') + 4);
          var jsonObject = JSON.parse(payload)['args'];
          for(var i = 0, len = jsonObject.length; i < len; i++) {
            var obj = JSON.parse(jsonObject[i]);
            var method = obj['method'];
            if (method === 'chatMsg') {
              chat.emit("message", obj);
            } else {
              console.log(obj);
            }
          }
        }
      });
    });
  }, function(e) {
    console.log(e);
  }).catch(function(e) {
    console.log(e);
  });
};

ChatAPI.prototype.SendMessage = function(message) {
  var chatMessage = {
    name: "message",
    args: [{
      method: "chatMsg",
      params: {
        "channel":this.channel,
        "name":this.client.username,
        "nameColor":this.color,
        "text":message
      }
    }]
  }
  var payload = "5:::" + JSON.stringify(chatMessage);
  this.websocket.send(payload);
}

module.exports = ChatAPI;