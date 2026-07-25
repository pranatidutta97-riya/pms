from app import create_app, socketio
import app.events

app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True, port=9005, host="0.0.0.0")