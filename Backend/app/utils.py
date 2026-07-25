import jwt
import datetime
import bcrypt
import os
from datetime import timezone

# hash password create
def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

# check input password and database password
def check_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

# generate JWT token
def generate_token(user_id, role):
    try:
        payload = {
            'user_id': str(user_id),
            'exp': datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=24),
            'iat': datetime.datetime.now(timezone.utc),
            'role': role
        }
        token = jwt.encode(payload, os.environ.get('SECRET_KEY'), algorithm='HS256')
        return token
    except Exception as e:
        return e