var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("server initialized");

var SOCKET_LIST = {};

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
	
  console.log('socket connection');
});

setInterval(function(){
  for(var i in SOCKET_LIST){
  var socket = SOCKET_LIST[i];
  socket.emit('socketUpdate', i);
  };
},1000/25);

