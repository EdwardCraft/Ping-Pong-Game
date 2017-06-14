
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const TIMER_MOVE_BALL = 3;

var canvas;
var canvasContext;
var delta;

var startMovementBall = false;

var ballX;
var ballY;


var velocityX = 10;
var velocityY = 5;



var playerOnePaddleY = 250;
var playerTwoPaddleY = 250;



var player; 
var players = {};
var numPlayers = 0;
var left = false;

var seconds = TIMER_MOVE_BALL;
var socket = io();
var playerTwoState = false;

var scoreLeft = 0;
var scoreRight = 0;

var winnerState = false;
var theWinner;


window.onload = function(){
	console.log(" game loaded !");
	canvas = document.getElementById('gameCanvas');
	canvasContext = canvas.getContext('2d');
	canvasContext.font="30px Arial";
	var framesPerScond = 30;

	ballX = canvas.width / 2;
	ballY = canvas.height / 2;

	sockets();
	

	setInterval(
		function(){update();render();
		},1000 / framesPerScond
	 );

	canvas.addEventListener('mousedown',handleMouseClick);

	canvas.addEventListener('mousemove',
		function(evt){
			var mousePos = calculateMousePos(evt);
			if(player != null)
				player.y = mousePos.y - (PADDLE_HEIGHT / 2) ;
		});

}


function setPlayer(left, id){
	player = new Object(); 
	player.id = id;
	player.left = left;
	if(!left){
		player.x = canvas.width - PADDLE_WIDTH;
		player.y = playerOnePaddleY;
	}else{
		player.x = 0;
		player.y = playerOnePaddleY;
	}
    
}

function setPlayers(left, id){
	var player = new Object();
	player.id = id;
	player.left = left;
	if(!left){
		player.x = canvas.width - PADDLE_WIDTH;
		player.y = playerOnePaddleY;
		players[numPlayers++] = player;
	}else{
		player.x = 0;
		player.y = playerOnePaddleY;
		players[numPlayers++] = player;
	}


}	

function sockets(){

	resetBall();

	socket.emit('canvas dimensions', {width: canvas.width, height: canvas.height});

	socket.on('socketID', function(data){
		if(data != null){
			setPlayer(data.left, data.id);
			console.log("Player id: "+data.id+' left: '+data.left);
		}
	}).on('newPlayer',function(data){
		if(data != null){
			setPlayers(data.left, data.id);
		}
	}).on('getPlayers', function(data){
		if(data != null){
			for(var i = 0; i < data.length; i++){
				var player = new Object(); 
				player.id = data[i].id;
				
				if(!data[i].left){
					player.x = canvas.width - PADDLE_WIDTH;
					player.y = data[i].y;
					player.left = data[i].left;
				}else{
					player.x = 0;
					player.y = data[i].y;
					player.left = data[i].left;
				}

				players[numPlayers++] = player;
			}
		}
	}).on('playerMove',function(data){
		if(data != null){
			for(var i = 0 in players){
				if(players[i].id == data.id){
					if(players[i].id != null){
						players[i].x = data.x;
						players[i].y = data.y;
					}
				}
			}
		}
	});




	socket.on('ballPosition', function(data){
		if(data != null){
			ballX = data.x;
			ballY = data.y;
		}	
	}).on('score right', function(data){
		if(data != null){
			scoreRight = data.score;
		}
	}).on('score left', function(data){
		if(data != null){
			scoreLeft = data.score;
		}
	}).on('winner', function(data){
		if(data != null){
			winnerState = true;
			theWinner = data.winer;
		}
	});


}


function handleMouseClick(evt){

	if(winnerState){
		winnerState = false;
		socket.emit('restart game',{id: player.id, winner:winnerState});
	}

}


function update(){
	
	updateServer();

}


function updateServer(){
	if(player != null)
		socket.emit('playerMove', player);
}



function winScreen(){
	//background---
	colorRect( 0, 0, canvas.width, canvas.height, 'black');
	//-------------

	canvasContext.fillStyle = 'white';
	renderWinerPlayers();

	canvasContext.font="50px Arial";
	canvasContext.fillText(theWinner + '   WINS ! ' , (canvas.width / 2)  - 130, canvas.height / 2);
	
	canvasContext.font="25px Arial";
	canvasContext.fillText('click to continue', (canvas.width / 2)  - 80, (canvas.height ) - 70);


}

function gameScreen(){
	//background---
	colorRect( 0, 0, canvas.width, canvas.height, 'black');
	//-------------


	drawNet();
	renderPlayers();

	circule(ballX, ballY, 10, 'white');
	
	canvasContext.fillText(scoreLeft, 200, 70);
	canvasContext.fillText(scoreRight, canvas.width - 200, 70);
}


function render(){
	
	if(!winnerState)gameScreen();
	if(winnerState)winScreen();

}

function drawNet(){

	for(var i = 0; i < canvas.height; i += 40){
		colorRect((canvas.width / 2) - 1,  i, 2, 20, 'white');
	}

}

function renderWinerPlayers(){

	if(theWinner == 'LEFT'){

		if(player.left)colorRect( player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');

		for(var i = 0 in players){
			var otherPlayer = players[i];
			if(otherPlayer.left){
				colorRect( otherPlayer.x, otherPlayer.y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
			}
		}
	}else{

		if(!player.left)colorRect( player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');

		for(var i = 0 in players){
			var otherPlayer = players[i];
			if(!otherPlayer.left){
				colorRect( otherPlayer.x, otherPlayer.y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
			}
		}
	}


}


function renderPlayers(){

	if(player != null)
		colorRect( player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');

	for(var i = 0 in players){
		var otherPlayer = players[i];
		colorRect( otherPlayer.x, otherPlayer.y, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');
	}

}


function circule(centerX, centerY, radius, color){
	canvasContext.fillStyle = color;
	canvasContext.beginPath();
	canvasContext.arc(centerX, centerY, radius, 0, Math.PI*2, true);
	canvasContext.fill();
}


function colorRect(leftX, topY, width, height, color){

	canvasContext.fillStyle = color;
	canvasContext.fillRect( leftX, topY, width, height);

}


function calculateMousePos(evt){
	var rect = canvas.getBoundingClientRect();
	var root = document.documentElement;
	var mouseX = evt.clientX - rect.left - root.scrollLeft;
	var mouseY = evt.clientY - rect.top - root.scrollTop;

	return{
		x:mouseX,
		y:mouseY
	};

}


function resetBall(){
	velocityX = -velocityX;
	seconds = TIMER_MOVE_BALL;
	ballX = canvas.width / 2;
	ballY = canvas.height / 2;

	socket.emit('start ball position',{ballX, ballY});

}

function collisionPaddle(paddle){
	if(ballY > paddle && ballY < (paddle + PADDLE_HEIGHT)){
		return true;
	}else return false;

}


function ballPauseMovement(){
	
	if( seconds <= 0){
		//seconds = TIMER_MOVE_BALL;
		return startMovementBall = true;
	}else{
		seconds -= 1/30;
		return startMovementBall = false;
	}
	

}