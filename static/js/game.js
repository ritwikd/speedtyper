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
var postGameWPMElem = $('.postgame .stats .final-wpm');
var postGameWoLElem = $('.postgame .stats .wol');
var postGameLoaderElem = $('.postgame .loader');
var postGameScoreBoardElem = $('.postgame .scoreboard');
var postGameScoresElem = $('.postgame .scores');

var canvasW = 750;
var canvasH = 350;

var statsOffset = 10;

var spedX = 215;
var spedY = canvasH;

var spedRimSize = 40;
var spedUnderWidth = 0;
var spedRimColor = '#FFF';

var spedNeedleFact = 0.9;
var spedNeedleX = spedX;
var spedNeedleY = spedY - 6;
var spedNeedleLength = 33;
var spedNeedleBaseSize = 5;
var spedNeedleColor = '#F09A22';

var canvasSmallFont = '22px Rajdhani';
var canvasMedFont = '36px Rajdhani';
var canvasBigFont = '52px Rajdhani';


var wpmDispDescX = 20;
var wpmDispDescY = canvasH - statsOffset;
var wpmDispX = wpmDispDescX + 80;
var wpmDispY = canvasH - statsOffset;

var userIdDescDispX = 275;
var userIdDescDispY = canvasH - statsOffset;
var userIdDispX = userIdDescDispX + 125;
var userIdDispY = canvasH - statsOffset;

var wordsLeftDispX = 500;
var wordsLeftDispY = canvasH - statsOffset;
var wordsLeftNumDispX = wordsLeftDispX + 190;


var racerStartPointX = 375;
var racerStartPointY = 150;


var webSocket = null;
var s_id = null;
var user_id = null;

var scoreboard = null;
var scoreLi = '<li class="score rounded"><div class="uname">USER ';
var scoreLiUser = '<li class="score rounded user"><div class="uname">USER ';
var wpmDiv = '</div><div class="wpm">';

var final_wpm;

var inputGoodColor = '#00ee66';
var inputBadColor = '#BB3333';

var winColor = '#03A678';
var loseColor = '#D64541';

var winString  = 'WIN';
var lossString = 'LOSS';

var countdown = null;

var updateServer = function() {
    webSocket.emit('update', {user: user_id, session: s_id, data: currentWPM});
};

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
};

var updateWord = function() {
    wordsLeft -= 1;
    currentWord = futureWords[0];
    currentWordElem.text(currentWord);
    futureWords = futureWords.slice(1, futureWords.length);
    futureWordsElem.text(futureWords.join(' '));
    inputElem.attr('maxlength', currentWord.length.toString());
                inputElem.css('background-color', '#898989');
    inputElem.val("");
    inputElem.css("width", getTextWidth(currentWord, '34px Source Sans Pro').toString() + "px");
};

var colorInput = function() {
    var currentInput = $('.input').val();
    var numCharsWord = currentInput.length;
    var goodSoFar = currentInput === currentWord.slice(0, numCharsWord);
    if (goodSoFar) {
        correctChars += 1;
        inputElem.css('background-color', inputGoodColor);
    } else {
        inputElem.css('background-color', inputBadColor);
    }
};

var finishedGame = function() {
    final_wpm = scoreboard[user_id]['wpm'];
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
    postGameWPMElem.text(Math.round(final_wpm).toString() + ' WPM');
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
    var scores = scoreboard[s_id];
    var win = scoreboard[s_id][0][0] == user_id;
    console.log(win);
    winString = (win) ?  winString : lossString;
    postGameWoLElem.text(winString);
    postGameWoLElem.css('background-color', (win) ? winColor : loseColor);
    scores.forEach(function(score) {
        var id = score[0];
        var wpm = score[1]["wpm"];
        if (id == user_id) {
            postGameScoresElem.append(scoreLiUser + id.toString() + wpmDiv + Math.round(wpm).toString() + ' WPM</div></li>')
        } else {
            postGameScoresElem.append(scoreLi + id.toString() + wpmDiv + Math.round(wpm).toString() + ' WPM</div></li>');
        }
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
    inputElem.css("width", getTextWidth(currentWord, '34px Source Sans Pro').toString() + "px");
    wpmIntId = setInterval(updateWPM, 8);
    canvasIntID = setInterval(draw, 8);
    webSocket.emit('started', {user: user_id, session: s_id, data: wordsLeft});
    serverUpID = setInterval(updateServer, 500);
    webSocket.on('update', function(data) { scoreboard = data;  });
    webSocket.on('finished', function(data) {
        final_wpm = scoreboard[user_id]['wpm'];
        postGameWPMElem.text(Math.round(final_wpm).toString() + ' WPM');
        scoreboard = data;
        if (Object.keys(scoreboard)[0] === s_id) {
            updateScoreboard();
        }
    });
    clearInterval(cdown);
};

inputElem.keypress(
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

function drawSpeedometer() {
    ctx.beginPath();
    ctx.strokeStyle = spedRimColor;
    ctx.fillStyle = spedRimColor;
    ctx.arc(spedX, spedY, spedRimSize, Math.PI, Math.PI * 2, false);
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
};

function drawStats() {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, canvasH - 50, canvasW, 75);

    ctx.fillStyle = spedRimColor;
    ctx.font = canvasMedFont;
    ctx.fillText('WPM', wpmDispDescX, wpmDispDescY);
    ctx.fillStyle = spedNeedleColor;
    ctx.font = canvasBigFont;
    ctx.fillText(Math.round(currentWPM).toString(), wpmDispX, wpmDispY);

    ctx.fillStyle = spedRimColor;
    ctx.font = canvasMedFont;
    ctx.fillText('WORDS LEFT', wordsLeftDispX, wordsLeftDispY);
    ctx.fillStyle = spedNeedleColor;
    ctx.font = canvasBigFont;
    ctx.fillText(wordsLeft.toString(), wordsLeftNumDispX, wordsLeftDispY);

    ctx.fillStyle = spedRimColor;
    ctx.font = canvasMedFont;
    ctx.fillText('USER ID', userIdDescDispX, userIdDescDispY);
    ctx.fillStyle = spedNeedleColor;
    ctx.font = canvasBigFont;
    ctx.fillText(user_id.toString(), userIdDispX, userIdDispY);
};

function drawRacers() {
    if (scoreboard == null) { return; }
    var wpm = 0; var users = 0;
    for (user in scoreboard) {
        wpm += scoreboard[user]['wpm'];
        users += 1;
    }
    wpm /= users;
    console.log("Average WPM: " + wpm.toString());
    for (user in scoreboard) {
        var user_wpm = scoreboard[user]['wpm'];
        var pct_diff = 100 * ((user_wpm - wpm)/wpm);
        console.log('User ' + user + ' WPM is ' +  + ' percent faster.');
        ctx.beginPath();

        ctx.fillStyle = spedNeedleColor;
        ctx.strokeStyle = spedNeedleColor;
        ctx.lineWidth = 3;
        ctx.arc(racerStartPointX, racerStartPointY, 10, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }

};


function draw() {
    ctx.clear();

    drawStats();
    drawSpeedometer();
    drawRacers();

}