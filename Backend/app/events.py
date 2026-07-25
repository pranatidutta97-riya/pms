from flask import request, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room
from . import socketio
from bson import ObjectId
from datetime import datetime, timezone

online_users = {}

@socketio.on('connect')
def test_connect():
    print('🔥 CLIENT CONNECTED SUCCESSFULLY TO BACKEND!', flush=True)

@socketio.on('go_online')
def go_online(data):
    user_id = str(data.get('user_id'))
    if user_id:
        online_users[user_id] = {"sid": request.sid, "status": "Working"}
        join_room(user_id) 
        
        emit('online_status_change', list(online_users.keys()), broadcast=True)
        print(f"User {user_id} is now ONLINE.", flush=True)
        
        db = current_app.db
        today_date = datetime.now().strftime('%Y-%m-%d')
        
        # for attandance
        try:
            existing_attandance = db.attandance.find_one({
                'user_id': ObjectId(user_id), 
                'date': today_date
            })
            if not existing_attandance:
                current_time = datetime.now()
                attandance_doc = {
                    'user_id': ObjectId(user_id),
                    'date': today_date,
                    'check_in_time': current_time,
                    'check_out_time': None,
                    'hours_logged': 0,
                    'status': 'Working'
                }
                db.attandance.insert_one(attandance_doc)
                print(f"✅ Created new attendance record for {user_id}", flush=True)
            else:
                db.attandance.update_one(
                    {'user_id': ObjectId(user_id), 'date': today_date},
                    {'$set': {'status': 'Working'}}
                )
        except Exception as e:
            print(f"❌ Error logging attendance check-in: {str(e)}", flush=True)

        try:
            user_info = db.employee.find_one({'_id': ObjectId(user_id)})
            if(user_info):
                emit('user_status_notification', {
                    'message': f"{user_info.get('name', 'Someone')} logged in",
                    'type': 'login'
                }, broadcast=True, include_self=False)
        except Exception as e:
            print(f"❌ Error broadcasting login notification: {str(e)}", flush=True)

        # for messages
        try:
            unread_messages = db.messages.find({'receiver_id': ObjectId(user_id), 'is_read': False})
            sender_ids = list(set([str(msg['sender_id']) for msg in unread_messages]))
            if sender_ids:
                print(f"📩 Sending offline notification senders to {user_id}: {sender_ids}", flush=True)
                emit('unread_notifications_on_login', sender_ids, room=request.sid)
        except Exception as e:
            print(f"❌ Error checking offline notifications: {str(e)}", flush=True)

@socketio.on('toggle_break')
def handle_toggle_break(data):
    user_id = str(data.get('user_id'))
    is_on_break = data.get('is_on_break') 
    
    if user_id in online_users:
        new_status = "Break" if is_on_break else "Working"
        online_users[user_id]["status"] = new_status
        
        emit('online_status_change', online_users, broadcast=True)
        
        db = current_app.db
        today_date = datetime.now().strftime('%Y-%m-%d')
        try:
            db.attandance.update_one(
                {'user_id': ObjectId(user_id), 'date': today_date},
                {'$set': {'status': new_status}}
            )
            print(f" User {user_id} status updated to {new_status} in DB", flush=True)
        except Exception as e:
            print(f"❌ Error updating break status: {str(e)}", flush=True)

@socketio.on('disconnect')
def test_disconnect():
    disconnected_user = None
    for user_id, sid in list(online_users.items()):
        if sid == request.sid:
            disconnected_user = user_id
            del online_users[user_id]
            break
            
    if disconnected_user:
        leave_room(disconnected_user)
        emit('online_status_change', list(online_users.keys()), broadcast=True)
        print(f"User {disconnected_user} went OFFLINE.", flush=True)
    
@socketio.on('go_offline')
def go_offline(data):
    user_id = str(data.get('user_id'))
    if user_id and user_id in online_users:
        online_users.pop(user_id, None)
        leave_room(user_id)

        emit('online_status_change', list(online_users.keys()), broadcast=True)
        print(f"User {user_id} is now OFFLINE.", flush=True)

        db = current_app.db
        today_date = datetime.now().strftime('%Y-%m-%d')

        try:
            attendance = db.attandance.find_one({
                'user_id': ObjectId(user_id),
                'date': today_date
            })
            if attendance and attendance['check_in_time']:
                check_in_time = attendance['check_in_time']
                check_out_time = datetime.now()
                time_diff = (check_out_time - check_in_time)
                hours_logged = round(time_diff.total_seconds() / 3600, 2)
                db.attandance.update_one(
                    {'_id': attendance['_id']},
                    {'$set': {
                        'check_out_time': check_out_time, 
                        'hours_logged': hours_logged,
                        'status': 'Offline'
                    }}
                )
                print(f"⏱️ Total hours updated for {user_id}: {hours_logged} hrs", flush=True)
        except Exception as e:
            print(f"❌ Error logging attendance check-out: {str(e)}", flush=True)

        try:
            user_info = db.employee.find_one({'_id': ObjectId(user_id)})
            if(user_info):
                emit('user_status_notification', {
                    'message': f"{user_info.get('name', 'Someone')} logged out",
                    'type': 'logout'
                }, broadcast=True, include_self=False)
        except Exception as e:
            print(f"❌ Error broadcasting logout notification: {str(e)}", flush=True)

            

@socketio.on('private_message')
def handle_private_message(data):
    sender_id = str(data.get('sender_id'))
    receiver_id = str(data.get('receiver_id'))
    text = data.get('text')

    is_receiver_online = receiver_id in online_users
    is_read_status = True if is_receiver_online else False

    db = current_app.db
    msg_payload = {
        'name': data.get('name'),
        'sender': data.get('sender'),
        'text': text,
        'time': data.get('time'),
        'sender_id': sender_id,
        'receiver_id': receiver_id
    }
    join_room(sender_id + receiver_id)
    
    msg_doc = {
        'sender_id': ObjectId(sender_id),
        'receiver_id': ObjectId(receiver_id),
        'text': text,
        'time': data.get('time'),
        'name': data.get('name'),
        'sender': data.get('sender'),
        'is_read': is_read_status
    }
    db.messages.insert_one(msg_doc)
    emit('message', msg_payload, room=sender_id)
    if receiver_id in online_users:
        emit('message', msg_payload, room=receiver_id)
        print(f"✅ Delivered to online user: {receiver_id}", flush=True)
    else:
        print(f"❌ User {receiver_id} is offline. Message emitted to room anyway.", flush=True)
        emit('message', msg_payload, room=receiver_id)

@socketio.on('get_chat_history')
def handle_chat_history(data):
    db = current_app.db
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')

    try:
        s_id = ObjectId(sender_id)
        r_id = ObjectId(receiver_id)
        
        db.messages.update_many(
            {"sender_id": r_id, "receiver_id": s_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        query = {
            "$or": [
                {"sender_id": s_id, "receiver_id": r_id},
                {"sender_id": r_id, "receiver_id": s_id}
            ]
        }
        db_messages = list(db.messages.find(query).sort("_id", 1)) 
        
        history = []
        for msg in db_messages:
            history.append({
                'sender_id': str(msg.get('sender_id')),
                'receiver_id': str(msg.get('receiver_id')),
                'name': msg.get('name'),
                'sender': msg.get('sender'),
                'text': msg.get('text'),
                'time': msg.get('time')
            })
            
        emit('chat_history_response', history, room=request.sid)
    except Exception as e:
        print(f" Error loading chat history: {str(e)}")
        emit('chat_history_response', [], room=request.sid)

# @socketio.on('message')
# def handle_connect(data):
#     print('Message recieved', data, flush=True)
#     emit('message', data, broadcast=True)