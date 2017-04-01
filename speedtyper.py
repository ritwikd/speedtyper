from flask import *
from flask_socketio import SocketIO, emit
import os
from random import sample

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
app = Flask(__name__, static_url_path='/static')
socketio = SocketIO(app)

def clean_word(word):
    return word.strip()

def get_words(word_list, num):
    return sample(word_list, num)

@app.route('/')
def hello_world():
    return 'Hello World!'

@app.route('/play/<session_id>')
def render_play(session_id):
    if session_id not in sessions:
        print('Creating session ' + session_id)
        words = get_words(word_list, 20)
        f_w = words[0]
        o_w = ' '.join(words[1:])
        sessions[session_id] = { 'words' : words, 'users' : {} }
        return render_template('play.html', name="Ritwik", start_word = f_w, future_words = o_w, s_id = session_id)
    else:
        words = sessions[session_id]['words']
        f_w = words[0]
        o_w = ' '.join(words[1:])
        return render_template('play.html', name="Ritwik", start_word= f_w , future_words = o_w, s_id = session_id)

sessions = {}

def print_session(session, s_id):
    users = session['users']
    print("Session: " + str(s_id))
    for u_id in users:
        print('User ' + str(u_id) + ': ' + str(users[u_id]['wpm']))

def session_finished(session):
    users = session['users']
    for u_id in users:
        if users[u_id]['status']:
            return False
    return True

def session_winner(session):
    max_wpm = -1
    max_uid = None
    users = session['users']
    for u_id in users:
        if users[u_id]['wpm'] > max_wpm:
            max_wpm = users[u_id]['wpm']
            max_uid = u_id
    return u_id

@socketio.on('started', namespace='/play')
def start_info(message):
    u_id = message['user']
    id = str(message['session'])
    words_left = str(message['data'])
    sessions[id]['users'][u_id] = {'wpm' : 0, 'status' : True}
    print('User ' + str(u_id) + ' in Session ' + str(id) + ' started with ' + words_left + ' words left.')

@socketio.on('update', namespace='/play')
def update_info(message):
    u_id = message['user']
    id = str(message['session'])
    wpm = message['data']
    if id in sessions:
        sessions[id]['users'][u_id]['wpm'] = wpm
        print_session(sessions[id], id)

@socketio.on('finished', namespace='/play')
def end_info(message):
    u_id = message['user']
    id = str(message['session'])
    wpm = message['data']
    print('User ' + str(u_id) + ' in Session ' + str(id) + ' finished with ' + str(wpm) + ' WPM.')
    sessions[id]['users'][u_id]['status'] = False
    if session_finished(sessions[id]):
        print('Session ' + str(id) + ' finished.')
        print('Winner was ' + str(session_winner(sessions[id])))
        del(sessions[id])


@socketio.on('connect', namespace='/play')
def test_connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/play')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    word_handler = open(os.path.join(SITE_ROOT, 'resources/words.txt'), 'r')
    word_lines = word_handler.readlines();
    word_handler.close()
    word_list = list(map(clean_word, word_lines))
    socketio.run(app, host="0.0.0.0", port=80)
