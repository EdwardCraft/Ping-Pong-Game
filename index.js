var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const WIN_SCORE = 100;

var framesPerScond = 30;
var velocityX = 10;
var velocityY = 5;

var ballX;
var ballY;

var canvasWidth;
var canvasHeight;


var startMoving = false;
var socketPong;

var PLAYER_SOCKETS = [];

var players = [];
var numPlayers = 0;
var facing = false;

var scoreLeft = 0;
var scoreRight = 0;
var endGame = false;


server.listen(port, function(){
	console.log('listenig om *:'+ port);
});


app.use(express.static(__dirname + '/public'));




io.on('connection', function(socket){

	pongLogin(socket);


});

	
function pongLogin(socket){
	console.log('Pong logic');
	numPlayers += 1;
	facing = !facing;

	if(!startMoving && numPlayers > 1){
		if(!endGame)startMoving = true;
	}



	socket.emit('socketID' , { id: socket.id, left: facing});
	socket.emit('getPlayers', players);
	socket.broadcast.emit('newPlayer', {id: socket.id, left: facing});
	socket.on('playerMove', function(data){
		data.id = socket.id;
		socket.broadcast.emit('playerMove', data);
		for(var i = 0; i < players.length; i++){
			if(players[i] != null)
				if(players[i].id == data.id){
					players[i].x = data.x;
					players[i].y = data.y;
				}
		}
	});

	socket.on('start ball position', function(data){
		ballX = data.ballX;
		ballY = data.ballY;
	});

	socket.on('canvas dimensions', function(data){
		canvasWidth = data.width;
		canvasHeight = data.height;
	});

	
	socket.on('restart game',function(data){
		for(var i = 0; i < players.length; i++){
			if(players[i] != null)
				if(players[i].id == data.id){
					players[i].winner = data.winner;
				} 
		}
	});

	socket.on('disconnect', function(){
		console.log('player disconnected :'+ socket.id);
		numPlayers -= 1;
		socket.broadcast.emit('playerDisconnected',{id: socket.id});
		for(var i = 0; i < players.length ; i++ ){
			if(players[i] != null){
				if(players[i].id == socket.id){
	 				players[i] = null;
	 				break
	 			}
			}
	 	}
	 	var key = 0;
	 	for(var i = 0; i < players.length; i++ ){
	 		if(players[i] == null && key == 0){
	 			key = 1;
	 		}
	 		if(key == 1){
	 			players[i] = players[i + 1];
	 		}
	 	}
	 	console.log('array size before: ' + players.length);
	 	players.length -= 1;
	 	console.log('array size after: ' + players.length);
	 	emptyArray(players);


	 	for(var i = 0; i < PLAYER_SOCKETS.length; i++){
	 		if(PLAYER_SOCKETS[i] != null){
	 			if(PLAYER_SOCKETS[i].id == socket.id){
	 				PLAYER_SOCKETS[i] = null;
	 				break;
	 			}
	 		}
	 	}

	 	var key = 0;
	 	for(var i = 0; i < PLAYER_SOCKETS.length; i++){
	 		if(PLAYER_SOCKETS[i] == null && key == 0){
	 			key = 1;
	 		}

	 		if(key == 1){
				PLAYER_SOCKETS[i] = PLAYER_SOCKETS[i + 1];
	 		}
	 		
	 	}
	 	
	 	PLAYER_SOCKETS.length -= 1;
	 	emptyArray(PLAYER_SOCKETS);

	});

	
	PLAYER_SOCKETS.push(socket);
	players.push(new player(socket.id, 0, 0, facing));


}



setInterval(
	function(){
		update();
		},1000 / framesPerScond
);



function update(){
		
		


		if(endGame)restartGame();
		if(!startMoving)return;

		if(numPlayers > 1){
			ballX += velocityX;
			ballY += velocityY;
		}
		
		if(ballX  < 0){
			var hit = false;
			for(var i = 0; i < players.length; i++){
				if(players[i] != null){
					if(players[i].left){
						if(collisionPaddle(players[i].y)){
							console.log('Player id: ' + players[i].id + 'hit padele');
							hit = true;
							velocityX = -velocityX;
							var deltaY = ballY - (players[i].y + (PADDLE_HEIGHT / 2));
							velocityY = deltaY * 0.35;
							break;
						}
					}
				}
			}

			if(!hit){
				scoreRight++;
					
				for(var i = 0; i < PLAYER_SOCKETS.length; i++){
					var socket = PLAYER_SOCKETS[i];
					if(socket != null)
						socket.emit('score right',{score: scoreRight});
				}

				resetBall();
				
			}

		}
	
		if(ballX >= canvasWidth){
			var hit = false;
			for(var i = 0; i < players.length; i++){
				if(players[i] != null){
					if(!players[i].left){
						if(collisionPaddle(players[i].y)){
							console.log('Player id: ' + players[i].id + 'hit padele');
							hit = true;
							velocityX = -velocityX;
							var deltaY = ballY - (players[i].y + (PADDLE_HEIGHT / 2));
							velocityY = deltaY * 0.35;
							break;
						}
					}
				}
			}

			if(!hit){
				scoreLeft++;

				for(var i = 0; i < PLAYER_SOCKETS.length; i++){
					var socket = PLAYER_SOCKETS[i];
					if(socket != null)
						socket.emit('score left',{score: scoreLeft});
				}
				
				resetBall();
				
			}

		}


		if(ballY  < 0){
			velocityY = -velocityY;
		}

		if(ballY  >= canvasHeight){
			velocityY = -velocityY;
		}




		

		ballPosition();
		checkWinner();

}


function ballPosition(){
	for(var i  = 0; i < PLAYER_SOCKETS.length; i++){
		var socket = PLAYER_SOCKETS[i];
		if(socket != null)
			socket.emit('ballPosition',{
				x:ballX, 
				y:ballY
			});
	}
}



function player(id, x, y, facing){

	this.id = id;
	this.x = x;
	this.y = y;
	this.left = facing;
	this.winner = false;
}

function emptyArray(array){
	if(numPlayers == 0){
	   	array.length = 0; // good!
	   	startMoving = false;

 	}

}


function collisionPaddle(paddleY){
	/*console.log('Ball Y: '+ ballY);
	console.log('paddleY: ' + paddleY);*/
	if(ballY > paddleY && ballY < (paddleY + PADDLE_HEIGHT)){
		return true;
	}

	return false;

}

function resetBall(){
	velocityX = -velocityX;
	
	ballX = canvasWidth / 2;
	ballY = canvasHeight / 2;

}

function checkWinner(){

	if((scoreLeft >= WIN_SCORE) || (scoreRight >= WIN_SCORE)){
		if(scoreLeft > scoreRight){
			for(var i = 0; i < PLAYER_SOCKETS.length; i++){
					var socket = PLAYER_SOCKETS[i];
					if(socket != null)
						socket.emit('winner',{winer: 'LEFT'});
			}
		}else{
			for(var i = 0; i < PLAYER_SOCKETS.length; i++){
					var socket = PLAYER_SOCKETS[i];
					if(socket != null)
						socket.emit('winner',{winer: 'RIGHT'});
			}
		}	

		scoreLeft = 0;
		scoreRight = 0;

		for(var i = 0; i < PLAYER_SOCKETS.length; i++){
			var socket = PLAYER_SOCKETS[i];
			if(socket != null){
				socket.emit('score right',{score: scoreRight});
				socket.emit('score left',{score: scoreLeft});
			}
		}


		for(var i = 0; i < players.length; i++){
			if(players[i] != null)
				players[i].winner = true;
		}
		
		startMoving = false;
		endGame = true;
	}


}

function restartGame(){
	var key = 0;
	for(var i = 0; i < players.length; i++){
		if(players[i] != null){
			if(players[i].winner == false ){
				key++;	
			}
		}
	}
		
	if(key == players.length){
		endGame = false;
		startMoving = true;
	}
	
}


function chatLogin(socket){
	console.log('a user conneted chat');
	var addedUser = false;
	
	socket.on('chat message', function(msg){
		//io.emit('chat message', msg);
		socket.broadcast.emit('chat message', {
			username: socket.username,
			message: data
		});
	});

	//when the client emits 'add user' this listens abd execute
	socket.on('add user', function(username){
		if(addedUser)return;

		//we store the username in the socket session for this client
		socket.username = username;
		addedUser = true;
		++numUsers;
		socket.emit('login', {
			numUsers: numUsers
		});


		//echo globally (all clients) tat a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});

	});


	//when the  client  emits 'typing', we  broadcast in to  others
	socket.on('typing',function(){
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	//when the client  emits 'stop typing', we  broadcast in to  others
	socket.on('stop typing', function(){
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});



	socket.on('disconnect', function(){
		if(addedUser){
			--numUsers;
			//echo globally that this client has left
			socket.broadcast.emit('user left',{
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
	

}

