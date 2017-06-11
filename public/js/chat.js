$(function(){

	var FADE_TIME = 150; //ms
	var TYPING_TIMER_LENGTH = 400; //ms
	var COLORS = [
		'#e21400', '#91580f', '#f8a700', '#f78b00',
    	'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    	'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
	];


	var $window = $(window);
	var $usernameInput = $('.usernameInput'); //input for username
	var $messages = $('#messages'); // Messages area
	var $inputMessage = $('#m');

	var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page


    var username;
    var connected = false;
    var typing = false;
    var lasTypingTime;
    var $currentInput = $usernameInput.focus();


	var socket = io();

	function setUsername(){
		username = cleanInput($usernameInput.val().trim());

		if(username){
			$loginPage.fadeOut();
			$chatPage.show();
			$loginPage.off('click');
			$currentInput = $inputMessage.focus();
		}

	}

	// Prevents input from having injected markup
 	function cleanInput (input) {
   	 	return $('<div/>').text(input).text();
  	}

  	$window.keydown(function (event){
  		//Auto-focus the current input when a key is typed
  		if(!(event.ctrlKey || event.metakey || event.altKey)){
  			$currentInput.focus();
  		}
  		//When the client hits ENTER on ther keyboard
  		if(event.which === 13){
  			if(username){

  			}else{
  				setUsername();
  			}
  		}

  	});





	$('form').submit(function(){
		socket.emit('chat message', $('#m').val());
		$('#m').val('');
		return false;
	});

	socket.on('chat message', function(msg){
		$('#messages').append($('<li>').text(msg));
	});




});