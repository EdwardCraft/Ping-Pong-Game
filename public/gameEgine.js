
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const TIMER_MOVE_BALL = 3;

var canvas;
var canvasContext;
var delta;

var startMovementBall = false;

var ballX = 0;
var ballY = 0;


var velocityX = 10;
var velocityY = 5;

var playerOnePaddleY = 250;
var playerTwoPaddleY = 250;

var seconds = TIMER_MOVE_BALL;





window.onload = function(){
	console.log(" game loaded !");
	canvas = document.getElementById('gameCanvas');
	canvasContext = canvas.getContext('2d');

	ballX = canvas.width / 2;
	ballY = canvas.height / 2;

	var framesPerScond = 30;
	setInterval(
		function(){update();render();},
		 1000 / framesPerScond
	 );

	canvas.addEventListener('mousemove',
		function(evt){
			var mousePos = calculateMousePos(evt);
			playerOnePaddleY = mousePos.y - (PADDLE_HEIGHT / 2) ;
		});

}



function update(){
	
	if(ballPauseMovement()){
		ballX += velocityX;
		ballY += velocityY;
	}
	
	
	if(ballX  < 0){
		
		if(collisionPaddle(playerOnePaddleY)){
			velocityX = -velocityX;
		}else{
			resetBall();
		}
		
	}

	if(ballX >= canvas.width){
		if(collisionPaddle(playerOnePaddleY)){
			velocityX = -velocityX;
		}else{
			resetBall();
		}
	}


	if(ballY  < 0){
		velocityY = -velocityY;
	}

	if(ballY  >= canvas.height){
		velocityY = -velocityY;
	}



}

function render(){
	//background---
	colorRect( 0, 0, canvas.width, canvas.height, 'black');
	//-------------

	//padele left player one
	colorRect( 0, playerOnePaddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 'white');

	//padele left player one
	colorRect( canvas.width - PADDLE_WIDTH, playerOnePaddleY, 
					PADDLE_WIDTH, PADDLE_HEIGHT, 'white');

	//ball
	circule(ballX, ballY, 10, 'white');
	
	
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