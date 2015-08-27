var WebSocket = require('ws');
var request = require('request');
var Promise = require('bluebird');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
Promise.promisifyAll(request);

var UserStore = require('../user_store.js');

function ChatAPI(client, channel, color) {
  this.client = client;
  this.channel = channel;
  this.color = color;
  this.websocket = null;
  this.waitingForUser = {};
  this.ready = false;
  EventEmitter.call(this);
};

util.inherits(ChatAPI, EventEmitter);

ChatAPI.prototype.LookupUser = function(name) {
  var chat = this;
  var userQuery = {
    name: "message",
    args: [{
      method: "getChannelUser",
      params: {
        channel: chat.channel,
        name: name
      }
    }]
  }
  var payload = "5:::" + JSON.stringify(userQuery);
  chat.websocket.send(payload);
}

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
              ///ignore our own messages
              if (obj['params']['name'] === client.username) {
                return;
              }
              
              if (!UserStore.Fetch(obj['params']['name'])) {
                if (!chat.waitingForUser[obj['params']['name']]) {
                  chat.waitingForUser[obj['params']['name']] = [];
                  chat.waitingForUser[obj['params']['name']].push(obj);
                  chat.LookupUser(obj['params']['name']);
                  console.log("looking up user.");
                } else {
                  chat.waitingForUser[obj['params']['name']].push(obj);
                }
              } else {
                //decode unicode text
                var i = 0;
                var newMessage = "";
                var code = ReadChar(obj['params']['text'], i++);
                while (code) {
                  newMessage += String.fromCharCode(code);
                  code = ReadChar(obj['params']['text'], i++);
                }
                //store unicode decoded message instead of original message
                obj['params']['text'] = newMessage;
                chat.emit('message', obj);
              }
            } else if (method === 'loginMsg'){ 
              //Notifiy the channel that the bot has joined.
              if (obj['params']['name'] === client.username) {
                chat.SendMessage("Nyaa~~~");
                chat.ready = true;
              }
              console.log(obj);
            } else if (method === 'userInfo') {
              UserStore.Store(obj['params'])
              console.log(obj);
              console.log("retrieved user.");
              var backlog = chat.waitingForUser[obj['params']['name']];
              for (var j = 0; j < backlog.length; j++) {
                var obj2 = chat.waitingForUser[obj['params']['name']][j];
                var i = 0;
                var newMessage = "";
                var code = ReadChar(obj2['params']['text'], i++);
                while (code) {
                  newMessage += String.fromCharCode(code);
                  code = ReadChar(obj2['params']['text'], i++);
                }
                //store unicode decoded message instead of original message
                obj2['params']['text'] = newMessage;
                chat.emit('message', obj2);
              }
              delete chat.waitingForUser[obj['params']['name']];
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

function ReadChar(str, idx) {
  // ex. fixedCharCodeAt('\uD800\uDC00', 0); // 65536
  // ex. fixedCharCodeAt('\uD800\uDC00', 1); // false
  idx = idx || 0;
  var code = str.charCodeAt(idx);
  var hi, low;
  
  // High surrogate (could change last hex to 0xDB7F to treat high
  // private surrogates as single characters)
  if (0xD800 <= code && code <= 0xDBFF) {
    hi = code;
    low = str.charCodeAt(idx + 1);
    if (isNaN(low)) {
      throw 'High surrogate not followed by low surrogate in fixedCharCodeAt()';
    }
    return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
  }
  if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
    // We return false to allow loops to skip this iteration since should have
    // already handled high surrogate above in the previous iteration
    return false;
    /*hi = str.charCodeAt(idx - 1);
    low = code;
    return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;*/
  }
  return code;
}

module.exports = ChatAPI;