from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timezone
from datetime import timedelta

user_bp = Blueprint('users', __name__)

@user_bp.route('/get-users', methods=['POST', 'GET'])

def get_users():
    db = current_app.db
    users_employee = list(db.employee.find())
    today_date = datetime.now().strftime('%Y-%m-%d')

    for user in users_employee:
        user['_id'] = str(user['_id'])
        user.pop('password', None)
        user['manager_id'] = user.get('manager_id')
        if user['manager_id']:
            managerName = db.employee.find_one({'_id': user['manager_id']})
            user['manager_id'] = str(user['manager_id'])
            user['manager_name'] = managerName.get('name') if managerName else "No Manager"
        user['team_id'] = user.get('team_id')
        if user['team_id']:
            teamName = db.teams.find_one({'_id': user['team_id']})
            user['team_id'] = str(user['team_id'])
            user['team_name'] = teamName.get('team_name') if teamName else "None"
        
        today_attendance = db.attandance.find_one({
            'user_id': ObjectId(user['_id']), 
            'date': today_date
        })
        if today_attendance:
           user['working_status'] = today_attendance.get('status', 'Offline')
        else:
            user['working_status'] = 'Offline'
    
    
    return jsonify({
        'employees': users_employee
    }), 200

@user_bp.route('/delete-user', methods=['DELETE'])
def delete_user():
    data = request.get_json()
    db = current_app.db
    user_id = data.get('user_id')
    try:
        user_obj_id = ObjectId(user_id)
        user = db.employee.find_one({'_id': user_obj_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        db.employee.delete_one({'_id': user_obj_id})

        if user.get('team_id'):
            team_id = user['team_id']
            db.teams.update_one(
                {'_id': team_id},
                {'$pull': {'employee_ids': user_obj_id}}
            )

        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Invalid ID format or System Error: {str(e)}'}), 400

@user_bp.route('/create-team', methods=['POST'])
def create_team():
    data = request.get_json()
    db = current_app.db
    
    team_name = data.get('team_name')
    
    if not team_name:
        return jsonify({'error': 'Team name is required'}), 400
    
    new_team = {
        'team_name': team_name,
        'manager_id': None, 
        'employee_ids': [] 
    }
    
    result = db.teams.insert_one(new_team)
    team_id = str(result.inserted_id)
    
    return jsonify({
        'message': 'Team created successfully',
        'team_id': team_id
    }), 201

@user_bp.route('/update-team', methods=['PUT'])
def update_team():
    data = request.get_json()
    db = current_app.db

    team_id = data.get('team_id') or data.get('teamId')
    team_name = data.get('newteamName') or data.get('team_name')
    
    try:
        t_id = ObjectId(team_id)
        team_doc = db.teams.find_one({'_id': t_id})
        if not team_doc:
            return jsonify({'error': 'Team not found'}), 404
        old_team_name = team_doc.get('team_name')
        
        if team_name != old_team_name:
            db.teams.update_one({'_id': t_id}, {'$set': {'team_name': team_name}})
            return jsonify({'message': 'Team name updated successfully'}), 200
        
        return jsonify({'success': True, 'message': 'No changes detected'}), 200
    except:
        return jsonify({'error': 'Invalid team ID format'}), 400

@user_bp.route('/assign-user', methods=['POST'])
def assign_user():
    data = request.get_json()
    db = current_app.db

    user_id = data.get('userId') or data.get('user_id')
    role = data.get('role')
    #manager_id = data.get('managerId') or data.get('manager_id')
    team_id = data.get('teamId') or data.get('team_id')

    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        u_id = ObjectId(user_id)
        t_id = ObjectId(team_id) if team_id else None
        #m_id = ObjectId(manager_id) if manager_id else None

        user_doc = db.employee.find_one({'_id': u_id})
        if not user_doc:
            return jsonify({'error': 'User not found'}), 404
        
        if role == "Manager" and not team_id:
            return jsonify({'error': 'Team ID is required for Managers'}), 400
        
        old_team_id = user_doc.get('team_id')
        old_t_id = ObjectId(str(old_team_id)) if old_team_id else None

        update_data = {}
        if role: update_data['role'] = role
        #if 'managerId' in data or 'manager_id' in data: update_data['manager_id'] = m_id
        if 'teamId' in data or 'team_id' in data: 
            update_data['team_id'] = t_id
            if t_id:
                team_doc = db.teams.find_one({'_id': t_id})
                team_manager_id = team_doc.get('manager_id')
                if role == "Manager":
                    update_data['manager_id'] = None
                else:
                    update_data['manager_id'] = team_manager_id
            else:
                update_data['manager_id'] = None

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        db.employee.update_one({'_id': u_id}, {'$set': update_data})
        
        if t_id != old_t_id:
            
            if old_t_id:
                db.teams.update_one(
                    {'_id': old_t_id},
                    {'$pull': {'employee_ids': u_id}}
                )
                db.teams.update_one(
                    {'_id': old_t_id, 'manager_id': u_id},
                    {'$set': {'manager_id': None}}
                )

            if t_id:
                if role == "Manager":
                    db.teams.update_one(
                        {'_id': t_id},
                        {'$set': {'manager_id': u_id}}
                    )
                    db.employee.update_many(
                        {'team_id': t_id, 'role': {'$ne': 'Manager'}},
                        {'$set': {'manager_id': u_id}}
                    )
                else:
                    db.teams.update_one(
                        {'_id': t_id},
                        {'$addToSet': {'employee_ids': u_id}}
                    )

        return jsonify({'success': True, 'message': 'User successfully assigned and teams updated'}), 200

    except Exception as e:
        return jsonify({'error': f'Invalid ID format or System Error: {str(e)}'}), 400
    
@user_bp.route('/get-teams', methods=['POST','GET'])
def get_teams():
    db = current_app.db
    teams = list(db.teams.find())
    for team in teams:
        team['_id'] = str(team['_id'])
        if team.get('manager_id'):
            managerName = db.employee.find_one({'_id': team['manager_id']})
            team['manager_id'] = str(team['manager_id'])
            
            team['manager_name'] = managerName.get('name') if managerName else "No Manager"
        else:
            team['manager_name'] = 'No Manager'
            team['manager_id'] = None
        team['employee_ids'] = [str(emp_id) for emp_id in team['employee_ids']]
    return jsonify(teams), 200

@user_bp.route('/get-working-status', methods=['POST', 'GET'])
def get_working_status():

    user_id = request.json.get('user_id')
    db = current_app.db
    try:
        cursor = db.attandance.find_one({
            'user_id': ObjectId(user_id),
            'date': datetime.now().strftime('%Y-%m-%d')
            })
        if cursor:
            attandance_sheet = {
                'user_id': str(cursor['user_id']),
                'status': cursor['status'],
                'check_in_time': cursor['check_in_time'].isoformat() if hasattr(cursor['check_in_time'], 'isoformat') else cursor['check_in_time'],
                'date': cursor['date'],
                'check_out_time': cursor['check_out_time'],
                'hours_logged': cursor['hours_logged']
            }
            return jsonify(attandance_sheet), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
@user_bp.route('/weekly-working-hours', methods = ['POST'])
def weekly_working_hours():
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    db = current_app.db
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5)

        attendance_records = db.attandance.find({
            'user_id': ObjectId(user_id),
            'date': {'$gte': start_date.strftime('%Y-%m-%d'), '$lte': end_date.strftime('%Y-%m-%d')}
        })

        weekly_data = []
        for record in attendance_records:
            weekly_data.append({
                'date': record['date'],
                'hours_logged': record['hours_logged'],
                'status': record['status']
            })

        return jsonify(weekly_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500  