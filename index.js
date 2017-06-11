var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;


server.listen(port, function(){
	console.log('listenig om *:'+ port);
});


app.use(express.static(__dirname + '/public'));


io.on('connection', function(socket){
	console.log('a user conneted');

	
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});

	socket.on('disconnect', function(){
		io.emit('chat message','user left');
	});


});









