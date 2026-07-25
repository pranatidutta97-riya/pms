from flask import Blueprint, request, jsonify, current_app
from app.utils import hash_password, check_password, generate_token
from pymongo import MongoClient
import os
import re
from google.oauth2 import id_token
from google.auth.transport import requests

def sanitize_email(email):
    if not isinstance(email, str) or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return None
    return email.strip().lower()

auth_bp = Blueprint('auth', __name__)

# from contextlib import contextmanager

# @contextmanager
# def get_db():
#     client = MongoClient(os.getenv('MONGO_URI'))
#     try:
#         yield client['pms']
#     finally:
#         client.close()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    email = sanitize_email(data.get('email', ''))
    if not email:
        return jsonify({'error': 'Invalid email'}), 400
    
    db = current_app.db

    #with get_db() as db:
    existing_user = db.employee.find_one({'email': email})
    if existing_user:
        return jsonify({'error': 'Email already exists'}), 400
    new_user = {
        'name': str(data['name']),
        'email': email,
        'password': hash_password(data['password']),
        'role': 'Employee',
        'manager_id': None,
        'team_id': None
    }
    db.employee.insert_one(new_user)
    return jsonify({
        'message': 'User registered successfully',
        'email': new_user['email']
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = sanitize_email(data.get('email', ''))
    if not email:
        return jsonify({'error': 'Invalid email'}), 400

    db = current_app.db

    #with get_db() as db:
    user = db.employee.find_one({'email': email})
    if user and check_password(data['password'], user['password']):
        token = generate_token(str(user['_id']), user['role'])
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'manager_id': str(user.get('manager_id')) if user.get('manager_id') else None,
                'team_id': str(user['team_id']) if user.get('team_id') else None
            }
        }), 200
    return jsonify({'error': 'Invalid email or password'}), 401

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get('token')

    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), os.environ.get('GOOGLE_CLIENT_ID'))
        db = current_app.db
        #with get_db() as db:
        user = db.employee.find_one({'email': idinfo['email']})
        if not user:
            new_user = {
                'name': idinfo['name'],
                'email': idinfo['email'],
                'role': 'Employee',
                'auth_provider': 'Google',
                'manager_id': None,
                'team_id': None
            }
            result = db.employee.insert_one(new_user)
            new_user['_id'] = result.inserted_id
            user = new_user

        token = generate_token(str(user['_id']), user['role'])
        return jsonify({
            'message': 'Google login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'manager_id': str(user.get('manager_id')) if user.get('manager_id') else None,
                'team_id': str(user['team_id']) if user.get('team_id') else None
            }
        }), 200

    except ValueError:
        return jsonify({'error': 'Invalid token'}), 401
