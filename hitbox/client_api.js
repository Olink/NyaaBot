var request = require('request');
var Promise = require('bluebird');
var zlib = require('zlib');

Promise.promisifyAll(request);

function Client(username, password) {
  this.hitboxApi = "https://api.hitbox.tv";
  this.username = username;
  this.password = password;
  this.authToken = "";
};

Client.prototype.Login = function() {
  var client = this;
  return new Promise(function (resolve, reject) {
    var loginArgs ={
      login:client.username,
      pass:client.password,
      app:"desktop"
    };

    var loginOptions = {
      url: client.hitboxApi + '/auth/token',
      form: loginArgs
    };

    console.log(loginOptions);
    request.postAsync(loginOptions).spread(function (resp, body) {
      var respObj = JSON.parse(body);
      //console.log(respObj);
      var authToken = respObj.authToken;
      var verifyArgs = {
        app: "desktop",
        authToken: respObj.authToken
      };

      var verifyOptions = {
        url: client.hitboxApi + '/auth/login',
        form: verifyArgs
      };

      request.postAsync(verifyOptions).spread(function (resp, body) {
        var verifyObj = JSON.parse(body);
        //console.log(verifyObj);
        if (verifyObj.user_id) {
          client.authToken = authToken;
          resolve();
        }
        else {
          reject();
        }
      });
    });
  });
};

Client.prototype.FetchSocketServers = function() {
  var api = this.hitboxApi;
  return new Promise(function(resolve) {
    request.getAsync(api + '/chat/servers?redis=true', {encoding: null}).spread(function (resp, body) {
      //console.log(resp);
      var url = "";
      if (resp.headers['content-encoding']) {
        //console.log(resp.headers['content-encoding'])
        if (resp.headers['content-encoding'] === 'gzip') {
          zlib.gunzip(body, function(err, dezipped) {
            console.log(dezipped.toString());
            var url = JSON.parse(dezipped.toString());
            resolve(url);
          });
        }
      } else {
        console.log(body);
        var url = JSON.parse(body);
        resolve(url);
      }
    });
  });

};

module.exports = Client;