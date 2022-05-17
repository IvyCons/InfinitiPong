// Global Variables
var DIRECTION = {
	IDLE: 0,
	UP: 1,
	DOWN: 2,
	LEFT: 3,
	RIGHT: 4
};

// window.addEventListener("gamepadconnected", function(e) {
// 	const gamepad = e.gamepad;
// 	console.log(`Gamepad connected at index ${gamepad.index}: ${gamepad.id}.
// 				${gamepad.buttons.length} buttons, ${gamepad.axes.length} axes.`);
//   });

// console.log(navigator.getGamepads());

var gameSpeed = 1;
var idLocal = [];
var idIn = [];
var rounds = [10, 10, 10, 30, 30, 100];
var colors = ['#1abc9c', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6'];
var access;
var ball;
var score;

var ctx;
// const image = document.getElementById('source');

var up = new Audio('audio/top/1.mp3')
var bottom = new Audio('audio/bottom/1.mp3');
var leftHit = new Audio('audio/leftHit.wav')
var rightHit = new Audio('audio/rightHit.wav')
var lose = new Audio('audio/score/1.mp3')
var ambient = new Audio('audio/ambient.mp3')
var bouncy = new Audio('audio/bouncy.wav')
var god = new Audio('audio/god.mp3')
const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;


var img1 = new Image(); // Image constructor
num = random(1,9).toString();
img1.src = 'balls/ball' + num + '.png';
console.log(img1.src);
var bkg = new Image();
num2 = 1;
bkg.src = 'bkgs/bkg' + num2 + '.png';

navigator.requestMIDIAccess().then(function(access) {
	access = access;

	// Get lists of available MIDI controllers
		const inputs = access.inputs;
	   const outputs = access.outputs;
	   inputs.forEach((input) => {
		   console.log(input.name); /* inherited property from MIDIPort */
		   idIn.push(input.id)
		   input.onmidimessage = function(message) {
			 console.log(message.data);
		   }
		 })
	   outputs.forEach((output) => {
		   console.log(output.name); /* inherited property from MIDIPort */
		   idLocal.push(output.id)
		   console.log(output.id)
		   output.onmidimessage = function(message) {
			 console.log(message.data);
		   }
		 })

 });
// document.body.appendChild(img1);
// The ball object (The cube that bounces back and forth)
var Ball = {
	new: function (incrementedSpeed) {
		return {
			width: 100,
			height: 100,
			midi: 32,
			x: (this.canvas.width / 2) - 9,
			y: (this.canvas.height / 2) - 9,
			moveX: DIRECTION.IDLE,
			moveY: DIRECTION.IDLE,
			speed: incrementedSpeed || 12 * gameSpeed
		};
	}
};



// The paddle object (The two lines that move up and down)
var Paddle = {
	new: function (side) {
		return {
			width: 30,
			height: 200,
			midi: 32,
			x: side === 'left' ? 150 : this.canvas.width - 150,
			y: (this.canvas.height / 2) - 35,
			score: 0,
			move: DIRECTION.IDLE,
			speed: 20 * gameSpeed
		};
	}
};

function convertRange( value, r1, r2 ) { 
    return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

var Game = {
	initialize: function () {
		this.canvas = document.querySelector('canvas');
		this.context = this.canvas.getContext('2d');
		ctx = this.context;

		this.canvas.width = 3500;
		this.canvas.height = 2000;

		this.canvas.style.width = (this.canvas.width / 2) + 'px';
		this.canvas.style.height = (this.canvas.height / 2) + 'px';

		this.player = Paddle.new.call(this, 'left');
		this.paddle = Paddle.new.call(this, 'right');
		this.ball = Ball.new.call(this);

		// this.paddle.speed = 8;
		this.running = this.over = false;
		this.turn = this.paddle;
		this.timer = this.round = 0;
		this.color = '#000000';



		// this.color = '#2c3e50';

		Pong.menu();
		Pong.listen();

		
	},
	
	sendMidi: function ( midiAccess, portID, pitch) {
		var noteOnMessage = [0x90, pitch, 0x7f];    // note on, middle C, full velocity
		var output = midiAccess.outputs.get(portID);
		// console.log(output)
		output.send(noteOnMessage); // sends the message.
	  },
	// offMiddleC: function ( midiAccess, portID ) {
	// 	var noteOnMessage = [0x90, 60, 0x7f];    // note on, middle C, full velocity
	// 	var output = midiAccess.outputs.get(portID);
	// 	console.log(output)
	// 	output.send(noteOffMessage); // sends the message.
	//   },


	endGameMenu: function (text) {
		// Change the canvas font size and color
		Pong.context.font = '50px Courier New';
		Pong.context.fillStyle = this.color;

		// Draw the rectangle behind the 'Press any key to begin' text.
		Pong.context.fillRect(
			Pong.canvas.width / 2 - 350,
			Pong.canvas.height / 2 - 48,
			700,
			100
		);

		// Change the canvas color;
		Pong.context.fillStyle = '#ffffff';

		// Draw the end game menu text ('Game Over' and 'Winner')
		Pong.context.fillText(text,
			Pong.canvas.width / 2,
			Pong.canvas.height / 2 + 15
		);

		setTimeout(function () {
			Pong = Object.assign({}, Game);
			Pong.initialize();
		}, 3000);
	},

	menu: function () {
		
		// Draw all the Pong objects in their current state
		Pong.draw();

		// Change the canvas font size and color
		this.context.font = '50px Courier New';
		this.context.fillStyle = this.color;

		// Draw the rectangle behind the 'Press any key to begin' text.
		this.context.fillRect(
			this.canvas.width / 2 - 350,
			this.canvas.height / 2 - 48,
			700,
			100
		);

		// Change the canvas color;
		this.context.fillStyle = '#ffffff';

		// Draw the 'press any key to begin' text
		this.context.fillText('Press any key to begin',
			this.canvas.width / 2,
			this.canvas.height / 2 + 15
		);
	},

	// Update all objects (move the player, paddle, ball, increment the score, etc.)
	update: function () {
		if (!this.over) {
			ball = this.ball;
			navigator.requestMIDIAccess().then(function(access) {
			
				// Get lists of available MIDI controllers
				const inputs = access.inputs;
				const outputs = access.outputs;
				// console.log(this.ball.midi);
				Pong.sendMidi(access, idLocal[1], ball.midi);
				// Pong.sendMidi(access, idLocal[2], 32);

			
			 });
			// Pong.inMidi(access, idIn[0])
			// If the ball collides with the bound limits - correct the x and y coords.
			if (this.ball.x <= 0) {
				Pong._resetTurn.call(this, this.paddle, this.player); 
				// navigator.requestMIDIAccess().then(function(access){
				// 	Pong.offMiddleC(access, -1585103829)
				// });
			}
			if (this.ball.x >= this.canvas.width) Pong._resetTurn.call(this, this.player, this.paddle);
			if (this.ball.y <= 0) {
				this.ball.moveY = DIRECTION.DOWN;
				up.play();
			}
			if (this.ball.y >= this.canvas.height - this.ball.height) {
				this.ball.moveY = DIRECTION.UP;
				bottom.play();
			}

			// Move player if they player.move value was updated by a keyboard event
			if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
			else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;

			// On new serve (start of each turn) move the ball to the correct side
			// and randomize the direction to add some challenge.
			if (Pong._turnDelayIsOver.call(this) && this.turn) {
				this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
				this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
				this.ball.y = Math.floor(Math.random() * this.canvas.height - 200) + 200;
				this.turn = null;
			}

			// If the player collides with the bound limits, update the x and y coords.
			if (this.player.y <= 0) this.player.y = 0;
			else if (this.player.y >= (this.canvas.height - this.player.height)) this.player.y = (this.canvas.height - this.player.height);

			// Move ball in intended direction based on moveY and moveX values
			if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
			else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
			if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
			else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;

			// Handle paddle (AI) UP and DOWN movement
			// if (this.paddle.y > this.ball.y - (this.paddle.height / 2)) {
			// 	if (this.ball.moveX === DIRECTION.RIGHT) this.paddle.y -= this.paddle.speed / 1.5;
			// 	else this.paddle.y -= this.paddle.speed / 4;
			// }
			// if (this.paddle.y < this.ball.y - (this.paddle.height / 2)) {
			// 	if (this.ball.moveX === DIRECTION.RIGHT) this.paddle.y += this.paddle.speed / 1.5;
			// 	else this.paddle.y += this.paddle.speed / 4;
			// }
			if (this.paddle.move === DIRECTION.UP) this.paddle.y -= this.paddle.speed;
			else if (this.paddle.move === DIRECTION.DOWN) this.paddle.y += this.paddle.speed;

			// Handle paddle (AI) wall collision
			if (this.paddle.y >= this.canvas.height - this.paddle.height) this.paddle.y = this.canvas.height - this.paddle.height;
			else if (this.paddle.y <= 0) this.paddle.y = 0;

			// Handle Player-Ball collisions
			if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
				if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
					this.ball.x = (this.player.x + this.ball.width);
					this.ball.moveX = DIRECTION.RIGHT;
					leftHit.play();
				}
			}

			// Handle paddle-ball collision
			if (this.ball.x - this.ball.width <= this.paddle.x && this.ball.x >= this.paddle.x - this.paddle.width) {
				if (this.ball.y <= this.paddle.y + this.paddle.height && this.ball.y + this.ball.height >= this.paddle.y) {
					this.ball.x = (this.paddle.x - this.ball.width);
					this.ball.moveX = DIRECTION.LEFT;

					rightHit.play();
				}
			}
		}

		if (this.player.score === rounds[this.round] || this.paddle.score === rounds[this.round] ) {
			// Check to see if there are any more rounds/levels left and display the victory screen if
			// there are not.
			// Handle the end of round transition
			// Check to see if the player won the round.
			if (!rounds[this.round + 1]) {
				this.over = true;
				setTimeout(function () { Pong.end4GameMenu('Winner!'); }, 1000);
			} else {
				// If there is another round, reset all the values and increment the round number.
				this.round += 1;
				num2 = this.round + 1;
				if (this.round = 2) {
					bkg.src = 'bkgs/bkg' + num2 + '.png';
					this.player.score = this.paddle.score = 0;
					this.player.speed += 0.5;
					this.paddle.speed += 0.5;
					this.ball.speed += 1;
					up = new Audio('audio/top/2.mp3')
					bottom = new Audio('audio/bottom/2.mp3');
				}else
				if (this.round = 3) {
					bkg.src = 'bkgs/bkg' + num2 + '.png';
					this.player.score = this.paddle.score = 0;
					this.player.speed += 0.5;
					this.paddle.speed += 0.5;
					this.ball.speed = 30;
					up = new Audio('audio/top/3.mp3')
					bottom = new Audio('audio/bottom/3.mp3');
					bouncy.play()
				}else
				if (this.round = 5) {
					bkg.src = 'bkgs/bkg' + num2 + '.png';
					img1.src = 'ball0.png';
					this.ball.speed = 1;
					this.ball.height = 500;
					this.ball.width = 500;
					up = new Audio('audio/top/4.mp3')
					bottom = new Audio('audio/bottom/4.mp3');
					ambient.play()
					god.play()
				}else {
					bkg.src = 'bkgs/bkg' + num2 + '.png';
					this.player.score = this.paddle.score = 0;
					this.player.speed += 0.5;
					this.paddle.speed += 0.5;
					this.ball.speed += 1;
				}
			}
		}
		// if (this.player.score === rounds[this.round]) {
		// 	// Check to see if there are any more rounds/levels left and display the victory screen if
		// 	// there are not.
		// }
		// // Check to see if the paddle/AI has won the round.
		// else if (this.paddle.score === rounds[this.round]) {
		// 	this.over = true;
		// 	setTimeout(function () { Pong.endGameMenu('Game Over!'); }, 1000);
		// }
	},

	// Draw the objects to the canvas element
	draw: function () {
		// Clear the Canvas
		this.context.clearRect(
			0,
			0,
			this.canvas.width,
			this.canvas.height
		);

		// Set the fill style to black
		this.context.fillStyle = this.color;

		// Draw the background
		// this.context.fillRect(
		// 	0,
		// 	0,
		// 	this.canvas.width,
		// 	this.canvas.height
		// );
		this.context.drawImage(bkg,0,0); 
		// Make sure the image is loaded first otherwise nothing will draw.
		// bkg.onload = function(){
		// 	this.context.drawImage(bkg,0,0);   
		// 	}


		// Set the fill style to white (For the paddles and the ball)
		this.context.fillStyle = '#ffffff';

		// Draw the Player
		this.context.fillRect(
			this.player.x,
			this.player.y,
			this.player.width,
			this.player.height
		);

		// Draw the Paddle
		this.context.fillRect(
			this.paddle.x,
			this.paddle.y,
			this.paddle.width,
			this.paddle.height
		);

		// Draw the Ball
		if (Pong._turnDelayIsOver.call(this)) {
			this.context.drawImage(img1, this.ball.x - this.ball.width, this.ball.y, this.ball.width, this.ball.height);
			this.ball.midi = parseInt(convertRange(this.ball.x,[-100,3000],[1,108]));
			
			// this.context.fillRect(
			// 	this.ball.x,
			// 	this.ball.y,
			// 	this.ball.width,
			// 	this.ball.height,
			// 	ctx.drawImage(img1, this.ball.x, this.ball.y, this.ball.width, this.ball.height)
				
			// );
		}

		// Draw the net (Line in the middle)
		this.context.beginPath();
		this.context.setLineDash([7, 15]);
		this.context.moveTo((this.canvas.width / 2), this.canvas.height - 140);
		this.context.lineTo((this.canvas.width / 2), 140);
		this.context.lineWidth = 10;
		this.context.strokeStyle = '#ffffff';
		this.context.stroke();

		// Set the default canvas font and align it to the center
		this.context.font = '100px Courier New';
		this.context.textAlign = 'center';

		// Draw the players score (left)
		this.context.fillText(
			this.player.score.toString(),
			(this.canvas.width / 2) - 300,
			200
		);

		// Draw the paddles score (right)
		this.context.fillText(
			this.paddle.score.toString(),
			(this.canvas.width / 2) + 300,
			200
		);

		// Change the font size for the center score text
		this.context.font = '30px Courier New';

		// Draw the winning score (center)
		this.context.fillText(
			'Round ' + (Pong.round + 1),
			(this.canvas.width / 2),
			35
		);

		// Change the font size for the center score value
		this.context.font = '40px Courier';

		// Draw the current round number
		this.context.fillText(
			rounds[Pong.round] ? rounds[Pong.round] : rounds[Pong.round - 1],
			(this.canvas.width / 2),
			100
		);
	},

	loop: function () {
		Pong.update();
		Pong.draw();

		// If the game is not over, draw the next frame.
		if (!Pong.over) requestAnimationFrame(Pong.loop);
	},

	listen: function () {
		document.addEventListener('keydown', function (key) {
			if (Pong.running === false) {
				Pong.running = true;
				window.requestAnimationFrame(Pong.loop);
			}
			if (key.keyCode === 38 ) Pong.paddle.move = DIRECTION.UP;
			if (key.keyCode === 40 || key.keyCode === 83) Pong.paddle.move = DIRECTION.DOWN;
			
			if (key.keyCode === 37) {Pong.ball.width += 10; Pong.ball.height += 10 }
			if (key.keyCode === 39) {Pong.ball.width -= 10; Pong.ball.height -= 10 }
		});
					// Handle the 'Press any key to begin' function and start the game.

		navigator.requestMIDIAccess().then(function(access) {

		const inputs = access.inputs;
		var input = inputs.get(idIn[0]);
		input.onmidimessage = function(message) {
		var msg = message.data
		console.log(input)
			if (msg[0] === 159 && msg[1] === 61 && msg[2] === 127 ) Pong.player.move = DIRECTION.UP;
			if (msg[0] === 143 && msg[1] === 61 && msg[2] === 127 ) Pong.player.move = DIRECTION.IDLE;
			if (msg[0] === 159 && msg[1] === 60 && msg[2] === 127 ) Pong.player.move = DIRECTION.DOWN;
			if (msg[0] === 143 && msg[1] === 60 && msg[2] === 127 ) Pong.player.move = DIRECTION.IDLE;
			console.log(msg);
		}

		var input1 = inputs.get(idIn[3]);
		input1.onmidimessage = function(message) {
			var msg1 = message.data;
			if (msg1[0] === 144 && msg1[1] === 12 ) {
				if (Pong.running === false) {
						Pong.running = true;
						window.requestAnimationFrame(Pong.loop);
					}
				}
			if (msg1[0] === 144 && msg1[1] === 13 ) rounds[1] = score + 1;
			if (msg1[0] === 144 && msg1[1] === 14 ) rounds[2] = score + 1;
			if (msg1[0] === 144 && msg1[1] === 15 ) rounds[3] = score + 1;
			if (msg1[0] === 144 && msg1[1] === 8 ) rounds[4] = score + 1;
			if (msg1[0] === 144 && msg1[1] === 9 ) rounds[5] = score + 1;
			console.log(msg1);
			}

 });

	// Handle up arrow and w key events
					
		
		// Handle down arrow and s key events
		setInterval(() => {
			const gamepad = navigator.getGamepads()[0]; // use the first gamepad
			console.log(`Left stick at (${gamepad.axes[0]}, ${gamepad.axes[1]})` );
			console.log(`Right stick at (${gamepad.axes[2]}, ${gamepad.axes[3]})` );
			if(gamepad.axes[3] <= -0.5){
				Pong.paddle.move = DIRECTION.UP;
				navigator.requestMIDIAccess().then(function(access) {
					Pong.sendMidi(access, idLocal[2], 63);
				 });
			}else if(gamepad.axes[3] >= 0.5 ){
				Pong.paddle.move = DIRECTION.DOWN;
				navigator.requestMIDIAccess().then(function(access) {
					Pong.sendMidi(access, idLocal[2], 62);
				 });
			}else{
				Pong.paddle.move = DIRECTION.IDLE;
			}
			if(gamepad.axes[0] <= -0.5 ){Pong.ball.width += 10; Pong.ball.height += 10 }
			if(gamepad.axes[0] >= 0.5 ) {Pong.ball.width -= 10; Pong.ball.height -= 10 }
			if(gamepad.axes[1] <= -0.5 ){Pong.ball.speed +=0.5; Pong.paddle.speed +=0.5;}
			if(gamepad.axes[1] >= 0.5 ) {Pong.ball.speed -=0.5; Pong.paddle.speed -=0.5; }
		}, 100)


		

		// Stop the player from moving when there are no keys being pressed.
		document.addEventListener('keyup', function (key) { Pong.player.move = DIRECTION.IDLE; });
		document.addEventListener('keyup', function (key) { Pong.paddle.move = DIRECTION.IDLE; });
	},

	// Reset the ball location, the player turns and set a delay before the next round begins.
	_resetTurn: function(victor, loser) {
		this.ball = Ball.new.call(this, this.ball.speed);
		this.turn = loser;
		this.timer = (new Date()).getTime();
		// this.color = this._generateRoundColor();
		victor.score++;
		// beep2.play();
		lose.play()
		num = random(0,9).toString();
		lose = new Audio('audio/score/'+ num +'.mp3')
		navigator.requestMIDIAccess().then(function(access) {
			Pong.sendMidi(access, idLocal[4], 1);
		 });
	},

	// Wait for a delay to have passed after each turn.
	_turnDelayIsOver: function() {
		return ((new Date()).getTime() - this.timer >= 1000);
	},

	// Select a random color as the background of each level/round.
	_generateRoundColor: function () {
		var newColor = colors[Math.floor(Math.random() * colors.length)];
		if (newColor === this.color) return Pong._generateRoundColor();
		return newColor;
	}
};

var Pong = Object.assign({}, Game);
Pong.initialize();