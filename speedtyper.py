from flask import *
from rating import hth

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'

@app.route('/play')
def render_play():
    return render_template('play.html', name="Ritwik")


if __name__ == '__main__':
    app.run()
