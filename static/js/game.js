/**
 * Created by Ritwik Dutta on 3/31/2017.
 */

var gameCanvas = $('.progress-display')[0];

var ctx = gameCanvas.getContext("2d");

var gameRunning = false;
var gameDone = false;

var currentWordElem = $('.words .current');
var futureWordsElem = $('.words .future');
var currentWord = $('.words .current')[0].innerText;
var futureWords = $('.words .future')[0].innerText.split(" ");

var wordsLeft = futureWords.length + 1;
var correctChars = 0;
var currentWPM = 0;

var startTime = null;
var currentTime = null;
var endTime = null;

var canvasIntID = null;
var wpmIntId = null;

var inputElem = $('.input');

var postgameElem = $('.postgame');
var postGameStatsElem = $('.postgame .stats');
var postGameLoaderElem = $('.postgame .loader');
var postGameScoreBoardElem = $('.postgame .scoreboard');
var postGameScoresElem = $('.postgame .scores');

var spedX = 150;
var spedY = 195;

var spedBackSize = 45;
var spedUnderWidth = 10;
var spedBackColor = '#000000';

var spedNeedleFact = 0.9;
var spedNeedleX = 150;
var spedNeedleY = 190;
var spedNeedleLength = 44;
var spedNeedleBaseSize = 5;
var spedNeedleColor = '#F09A22';

var wpmDispX = 20;
var wpmDispY = 195;

var wordsLeftDispX = 590;
var wordsLeftDispY = 195;
var wordsLeftNumDispX = wordsLeftDispX + 120;

var userIdDescDispX = 350;
var userIdDescDispY = 195;
var userIdDispX = 425;
var userIdDispY = 195;

var webSocket = null;
var s_id = null;
var user_id = null;

var scoreboard = null;
var scoreLi = '<li class="score"><div class="uname">';
var wpmDiv = '</div><div class="wpm">';

var updateServer = function() {
    webSocket.emit('update', {user: user_id, session: s_id, data: currentWPM});
}

var updateWord = function() {
    wordsLeft -= 1;
    currentWord = futureWords[0];
    currentWordElem.text(currentWord);
    futureWords = futureWords.slice(1, futureWords.length);
    futureWordsElem.text(futureWords.join(' '));
    inputElem.attr('maxlength', currentWord.length.toString());
                inputElem.css('background-color', '#898989');
    inputElem.val("");
};

var colorInput = function() {
    var currentInput = $('.input').val();
    var numCharsWord = currentInput.length;
    var goodSoFar = currentInput === currentWord.slice(0, numCharsWord);
    if (goodSoFar) {
        correctChars += 1;
        inputElem.css('background-color', '#00ee66');
    } else {
        inputElem.css('background-color', '#BB3333');
    }
};

var finishedGame = function() {
    var final_wpm = scoreboard[user_id]['wpm'];
    $('.words-display').css('display', 'none');
    inputElem.css('display', 'none');
    gameRunning = false;
    gameDone = true;
    clearInterval(wpmIntId);
    clearInterval(canvasIntID);
    clearInterval(serverUpID);
    $('.progress-display').animate({
            height: "toggle"
    }, 150);
    postgameElem.css('display', 'block');
    postGameStatsElem.text(Math.round(final_wpm).toString() + ' WPM');
    postgameElem.fadeIn(150);
    webSocket.emit('finished', {user: user_id, session: s_id, data: currentWPM});
    postGameLoaderElem.css('display', 'block');
    postGameLoaderElem.fadeIn(150);
};

var updateScoreboard = function() {
    postGameLoaderElem.fadeOut(150, function() {
        postGameLoaderElem.css('display', 'none');
    });
    postGameScoreBoardElem.css('display', 'block');
    postGameScoreBoardElem.fadeIn(150);
    console.log(scoreboard);
    var scores = scoreboard['scores'];
    scores.forEach(function(score) {
        console.log(score);
        var id = score[0];
        var wpm = score[1]["wpm"];
        postGameScoresElem.append(scoreLi + id.toString() + wpmDiv + Math.round(wpm).toString() + ' WPM</div>');
    });

};

var updateWPM = function() {
    currentTime = new Date();
    currentWPM = correctChars / ((currentTime - startTime)/12000);
};

var checkWord = function() {
    var currentInput = inputElem.val();
    if (currentInput == currentWord) {
        if (futureWords.length == 0) {
            finishedGame();
            return;
        }
        updateWord();
    } else {
        inputElem.val(currentInput.replace(" ", ""));
    }
};


var startGame = function() {
    gameRunning = true;
    startTime = new Date();
    inputElem.attr('maxlength', currentWord.length.toString());
    wpmIntId = setInterval(updateWPM, 8);
    canvasIntID = setInterval(draw, 8);
    webSocket.emit('started', {user: user_id, session: s_id, data: wordsLeft});
    serverUpID = setInterval(updateServer, 500);
    webSocket.on('update', function(msg) {
        scoreboard = msg;
        console.log(scoreboard);
    });

    webSocket.on('finished', function(msg) {
        scoreboard = msg;
        console.log('Done.');
        updateScoreboard();
    });
};

inputElem.keydown(
    function(event) {
        if (!gameRunning) {
            startGame();
        }
    });

inputElem.keyup(
    function(event) {
        if (gameRunning) {
            if (event.keyCode == 32) {
                checkWord();
            } else {
                colorInput();
            }
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

function draw() {
    ctx.clear();

    ctx.fillStyle = '#FFF';

    ctx.font = '56px Rajdhani';
    ctx.fillText(Math.round(currentWPM).toString(), wpmDispX, wpmDispY);

    ctx.font = '22px Rajdhani';
    ctx.fillText('WORDS LEFT', wordsLeftDispX, wordsLeftDispY);
    ctx.font = '32px Rajdhani';
    ctx.fillText(wordsLeft.toString(), wordsLeftNumDispX, wordsLeftDispY);

    ctx.font = '22px Rajdhani';
    ctx.fillText('USER ID', userIdDescDispX, userIdDescDispY);
    ctx.font = '32px Rajdhani';
    ctx.fillText(user_id.toString(), userIdDispX, userIdDispY);

    ctx.beginPath();
    ctx.strokeStyle = spedBackColor;
    ctx.fillStyle = spedBackColor;
    ctx.arc(spedX, spedY, spedBackSize, Math.PI, Math.PI * 2, false);
    ctx.fill();

    ctx.lineWidth = spedUnderWidth;
    ctx.moveTo(spedX - spedBackSize - 4.5, spedY);
    ctx.lineTo(spedX + spedBackSize + 4.5, spedY);
    ctx.stroke();

    ctx.closePath();


    ctx.beginPath();

    ctx.fillStyle = spedNeedleColor;
    ctx.strokeStyle = spedNeedleColor;
    ctx.lineWidth = 3;
    ctx.arc(spedNeedleX, spedNeedleY, spedNeedleBaseSize, 0, Math.PI * 2, false);
    ctx.fill();

    var theta = 180 + (currentWPM * spedNeedleFact);
    ctx.moveTo(spedNeedleX, spedNeedleY);
    ctx.lineTo(spedNeedleX + spedNeedleLength * Math.cos(Math.PI * theta / 180.0), spedNeedleY + spedNeedleLength * Math.sin(Math.PI * theta / 180.0));
    ctx.stroke();

    ctx.closePath();
}