/**
 * Created by Ritwik Dutta on 3/31/2017.
 */

var gameCanvas = $('.progress-display')[0];

var ctx = gameCanvas.getContext("2d");

var currentWordTyped = '';

var gameRunning = false;
var gameDone = false;

var correctWords = 0;
var currentWPM = 0;

var startTime = null;
var currentTime = null;
var endTime = null;

var canvasIntID = null;
var wpmIntId = null;

currentWordElem = $('.words .current');
futureWordsElem = $('.words .future');
currentWord = $('.words .current')[0].innerText;
futureWords = $('.words .future')[0].innerText.split(" ");

var wrong = true;

var updateWord = function() {
    currentWord = futureWords[0];
    currentWordElem.text(currentWord);
    futureWords = futureWords.slice(1, futureWords.length);
    futureWordsElem.text(futureWords.join(' '));
    $('.input').attr('maxlength', currentWord.length.toString());
};

var colorInput = function() {
    var numCharsWord = currentWordTyped.length;
    var goodSoFar = currentWordTyped === currentWord.slice(0, numCharsWord);
    if (goodSoFar) {
            $('.input').removeClass('wrong');
            $('.input').addClass('correct');
    } else {
            $('.input').removeClass('correct');
            $('.input').addClass('wrong');
    }
};

var finishedGame = function() {
    $('.words-display').css('display', 'none');
    $('.input').css('display', 'none');
    gameRunning = false;
    gameDone = true;
    clearInterval(wpmIntId);
    clearInterval(wpmIntId);
    $('.progress-display').animate({
            height: "toggle"
    }, 150);
    $('.postgame').css('display', 'block');
    $('.postgame .stats').text(Math.round(currentWPM).toString() + ' WPM');
    $('.postgame').fadeIn(250);
};

var updateWPM = function() {
    currentTime = new Date();
    currentWPM = correctWords / ((currentTime - startTime)/60000);
};

var checkWord = function() {
    if (currentWordTyped == currentWord) {
        if (futureWords.length == 0) {
            finishedGame();
            return;
        }
        updateWord();
        updateWPM();
        $('.input').val('');
        $('.input').removeClass('wrong');
        $('.input').removeClass('correct');
        correctWords += 1;
    } else {
        currentWordTyped = currentWordTyped.replace(' ', '');
        $('.input').val(currentWordTyped);
    }
};


var startGame = function() {
    gameRunning = true;
    startTime = new Date();
    $('.input').attr('maxlength', currentWord.length.toString());
};

$('.input').click(
    function(event) {
        if (!gameRunning) {
            startGame();
        }
    });

$('.input').keyup(
    function(event) {
        if (gameRunning) {
            if (event.keyCode == 32) {
                checkWord();
            }
            currentWordTyped = $(this).val();
            colorInput();
        }
    });

CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }
};

function drawLiveHUD() {
    ctx.fillStyle = '#FFF';
    ctx.font = '48px Rajdhani';
    ctx.fillText(Math.round(currentWPM).toString(), 20, 195);
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.arc(150, 190, 45, Math.PI, Math.PI * 2, false);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.moveTo(150 - 50, 195);
    ctx.lineTo(150 + 50, 195);
    ctx.stroke();
    ctx.closePath();
    r =  44;
    theta = 180 + (currentWPM * 0.9);
    ctx.beginPath();
    ctx.fillStyle = '#F09A22';
    ctx.strokeStyle = '#F09A22';
    ctx.lineWidth = 3;
    ctx.arc(150, 190, 5, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.moveTo(150, 190);
    ctx.lineTo(150 + r * Math.cos(Math.PI * theta / 180.0), 195 + r * Math.sin(Math.PI * theta / 180.0));
    ctx.stroke();
    ctx.closePath();
}

function draw() {
    ctx.clear(); drawLiveHUD();
}


canvasIntID = setInterval(updateWPM, 10);
wpmIntId = setInterval(draw, 10);


