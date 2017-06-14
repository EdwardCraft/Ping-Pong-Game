var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const WIN_SCORE = 1;

var framesPerScond = 30;
var velocityX = 10;
var velocityY = 5;

var ballX;
var ballY;

var canvasWidth;
var canvasHeight;


var startMoving = false;
var socketPong;
var SOCKET_BALLS = {};

var players = [];
var numPlayers = 0;
var facing = false;

var scoreLeft = 0;
var scoreRight = 0;
var socketScore = [];
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
			if(players[i].id == data.id){
				players[i].x = data.x;
				players[i].y = data.y;
			}
		}

	});



	SOCKET_BALLS[numPlayers] = socket;
	

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
			if(players[i].id == data.id){
				players[i].winner = data.winner;
			} 
		}
	});


	
	socketScore.push(socket);
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

		ballX += velocityX;
		ballY += velocityY;
		
	
		if(ballX  < 0){
			var hit = false;
			for(var i = 0; i < players.length; i++){
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

			if(!hit){
				scoreRight++;
					
				for(var i = 0; i < socketScore.length; i++){
					var socket = socketScore[i];
					socket.emit('score right',{score: scoreRight});
				}

				resetBall();
				
			}

		}
	
		if(ballX >= canvasWidth){
			var hit = false;
			for(var i = 0; i < players.length; i++){
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

			if(!hit){
				scoreLeft++;

				for(var i = 0; i < socketScore.length; i++){
					var socket = socketScore[i];
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




		for(var i in SOCKET_BALLS){
			var socket = SOCKET_BALLS[i];
			socket.emit('ballPosition',{
				x:ballX, 
				y:ballY
			});
			
		}


		checkWinner();

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



function player(id, x, y, facing){
	this.id = id;
	this.x = x;
	this.y = y;
	this.left = facing;
	this.winner = false;

}

function emptyArray(){
	if(numPlayers == 0){
	   	players.length = 0; // good!
 	}

}


function collisionPaddle(paddleY){
	if(ballY > paddleY && ballY < (paddleY + PADDLE_HEIGHT)){
		return true;
	}else return false;

}

function resetBall(){
	velocityX = -velocityX;
	
	ballX = canvasWidth / 2;
	ballY = canvasHeight / 2;

}

function checkWinner(){



	if((scoreLeft >= WIN_SCORE) || (scoreRight >= WIN_SCORE)){
		if(scoreLeft > scoreRight){
			for(var i = 0; i < socketScore.length; i++){
					var socket = socketScore[i];
					socket.emit('winner',{winer: 'LEFT'});
			}
		}else{
			for(var i = 0; i < socketScore.length; i++){
					var socket = socketScore[i];
					socket.emit('winner',{winer: 'RIGHT'});
			}
		}	

		scoreLeft = 0;
		scoreRight = 0;

		for(var i = 0; i < socketScore.length; i++){
			var socket = socketScore[i];
			socket.emit('score right',{score: scoreRight});
			socket.emit('score left',{score: scoreLeft});
		}


		for(var i = 0; i < players.length; i++){
			players[i].winner = true;
		}
		
		startMoving = false;
		endGame = true;
	}


}

function restartGame(){
	var key = 0;
	for(var i = 0; i < players.length; i++){
		if(players[i].winner == false ){
				key++;	
		}
	}
		
	if(key == players.length){
		endGame = false;
		startMoving = true;
	}
	


}
