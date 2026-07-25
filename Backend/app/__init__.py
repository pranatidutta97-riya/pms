from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from flask_socketio import SocketIO
from pymongo import MongoClient

socketio = SocketIO()
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})
    

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.config['MONGO_URI'] = os.environ.get('MONGO_URI')
    # app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID')

    client = MongoClient(app.config['MONGO_URI'])
    app.db = client['pms']
    print("Current Working Database:", app.db.name)

    socketio.init_app(app, cors_allowed_origins="*")

    from app.auth import auth_bp
    from app.users import user_bp
    from app.projects import project_bp
    from app.charts import chart_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(project_bp, url_prefix='/api/project')
    app.register_blueprint(chart_bp, url_prefix='/api/chart')
    

    return app
