from flask import *
from flask_socketio import SocketIO, emit
import os
from random import sample
from time import time

USERS_START = 1
CDOWN_LENGTH = 5000
NUM_WORDS = 25

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
    words = []
    if session_id not in sessions:
        print('Creating session ' + session_id)
        words = get_words(word_list, NUM_WORDS)
        sessions[session_id] = {'words': words, 'num_u': 1, 'users': {}, 'start' : -1}
    else:
        if sessions[session_id]['num_u'] > 4:
            return 'Room full.'
        sessions[session_id]['num_u'] += 1
        words = sessions[session_id]['words']

    f_w = words[0]
    o_w = ' '.join(words[1:])
    return render_template('play.html', start_word=f_w, future_words=o_w, s_id=session_id, u_id=sessions[session_id]['num_u'])

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
    sessions[id]['users'][u_id]['status'] = True

@socketio.on('joined', namespace='/play')
def user_joined(message):
    u_id = message['user']
    id = str(message['session'])
    time_since_start = (int(time() * 1000) - sessions[id]['start'])
    sessions[id]['users'][u_id] = {'wpm': 0, 'status': False, 'progress' : 0}

    print('User ' +  str(u_id) + ' joined Session ' + id + '.')

    if sessions[id]['num_u'] > USERS_START:
        if sessions[id]['start'] > -1:
            if time_since_start > 0:
                emit('countdown', {'session': id, 'time': 0}, broadcast=False)
            else:
                emit('countdown', {'session': id, 'time': abs(time_since_start)}, broadcast=False)
        else:
            sessions[id]['start'] = int(time() * 1000) + CDOWN_LENGTH
            emit('countdown', {'session': id, 'time': CDOWN_LENGTH}, broadcast=True)


@socketio.on('update', namespace='/play')
def update_info(message):
    id = str(message['session'])

    if id in sessions:
        u_id = message['user']
        wpm = message['wpm']
        prog = message['progress']

        sessions[id]['users'][u_id]['wpm'] = wpm
        sessions[id]['users'][u_id]['progress'] = prog

        #print_session(sessions[id], id)

        emit('update', {'session' : id, 'users' : sessions[id]['users'] }, broadcast=True)

@socketio.on('finished', namespace='/play')
def end_info(message):
    u_id = message['user']
    id = str(message['session'])
    wpm = message['wpm']
    prog = message['progress']

    print('User ' + str(u_id) + ' in Session ' + str(id) + ' finished with ' + str(wpm) + ' WPM.')

    sessions[id]['users'][u_id]['wpm'] = wpm
    sessions[id]['users'][u_id]['progress'] = prog
    sessions[id]['users'][u_id]['status'] = False

    emit('update', sessions[id]['users'], broadcast=True)

    if session_finished(sessions[id]):
        print('Session ' + str(id) + ' finished.')
        print('User ' + str(session_winner(sessions[id])) + ' won.')
        users = sessions[id]['users']
        sorted_users = sorted(users.items(), key=lambda user: user[1]['wpm'], reverse=True)
        emit('finished', {'session' : id, 'users' : sorted_users }, broadcast=True)
        del(sessions[id])

@socketio.on('disconnect', namespace='/play')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    word_handler = open(os.path.join(SITE_ROOT, 'resources/words.txt'), 'r')
    word_lines = word_handler.readlines();
    word_handler.close()
    word_list = list(map(clean_word, word_lines))
    socketio.run(app, host="0.0.0.0", port=80)
