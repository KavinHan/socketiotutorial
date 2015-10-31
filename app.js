var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

// url: http://localhost:8080/
app.get('/', function (req, res) {
  res.sendfile('index.html');
});
// url: http://localhost:8080/server.html
app.get('/server', function (req, res) {
  res.sendfile('public/server.html');
});

// url: http://localhost:8080/client.html
app.get('/client', function (req, res) {
  res.sendfile('public/client.html');
});

var server = app.listen(8090, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

// socket id: from connect to disconnect socket id will not change
var serverIDArr = []; // save all server socket id
var clientIDArr = []; // save all client socket id

var io = require('socket.io')(server);

io.on('connection', function (socket) {
  // if any client connect this server, will send 'status' event
  socket.emit('status', { status: true });

  // remove all disconnected server
  function removeDisconnectedServer() {
    for (var i = 0; i < serverIDArr.length; i++) {
      if (!io.sockets.connected[serverIDArr[i]])serverIDArr.splice(i, 1);
    }
  }

  // remove all disconnected Client
  function removeDisconnectedClient() {
    for (var i = 0; i < clientIDArr.length; i++) {
      if (!io.sockets.connected[clientIDArr[i]])clientIDArr.splice(i, 1);
    }
  }
  // save client id to clientIDArr
  // this event just run when client initilize,
  // and when any client every time initilizing then socket id will change
  // so don't need check is clientIDArr has same client socket id.^^
  socket.on('save-client-id', function (data) {
    // remove all disconnected Client
    removeDisconnectedClient();
    // push current client socket id
    clientIDArr.push(data.id);
    console.log('Client ID List => ' + JSON.stringify(clientIDArr));
  });

  // save server id to clientIDArr
  // same reason with client...
  // so don't need check is serverIDArr has same server socket id.^^
  socket.on('save-server-id', function (data) {
    // remove all disconnected server
    removeDisconnectedServer();
    // push current server socket id
    serverIDArr.push(data.id);
    console.log('Server ID List => ' + JSON.stringify(serverIDArr));
  });

  socket.on('save-client-msg', function(data) {
    console.log(data);
    removeDisconnectedServer();
    var i;
    // send client msg to all server
    for (i = 0; i < serverIDArr.length; i++) {
      io.sockets.connected[serverIDArr[i]].emit('update-client-msg', {
        clientIDArr: clientIDArr,
        client: data
      });
    }
  });
});
