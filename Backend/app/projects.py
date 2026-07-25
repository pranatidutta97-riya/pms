from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timezone
from requests import get

project_bp = Blueprint('projects', __name__)

def sync_project_logged_hours(db, project_id):
    try:
        p_id = ObjectId(str(project_id))
        
        pipeline = [
            {'$match': {'project_id': p_id}},
            {'$group': {'_id': '$project_id', 'total_hours': {'$sum': '$total_logged_hours'}}}
        ]
        result = list(db.tasks.aggregate(pipeline))
        
        total_hours = float(result[0]['total_hours']) if result else 0.0

        db.projects.update_one(
            {'_id': p_id},
            {'$set': {'logged_hours': total_hours}}
        )
    except Exception as e:
        print(f"Error syncing project logged hours: {e}")

@project_bp.route("/create-project", methods=["POST"])
def create_project():
    data = request.get_json()
    db = current_app.db

    project_name = data.get('projectTitle')
    incoming_team_ids = data.get('teams', [])
    formatted_team_ids = []
    for team_id in incoming_team_ids:
        if team_id: 
            formatted_team_ids.append(ObjectId(team_id))

    
    new_project = {
        'project_title': project_name,
        'team_ids': formatted_team_ids,
        'deadline': data.get('deadline'),
        'status': data.get('status'),
        'priority': data.get('priority'),
        'description': data.get('projectDesc'),
        'isbillable': data.get('isbillable', False),
        'estimated_hours': float(data.get('estimated_hours', 0)),
        'logged_hours': 0.0,
        'created_at': datetime.now()
    }

    result = db.projects.insert_one(new_project)
    project_id = str(result.inserted_id)

    return jsonify({
        'message': 'Project created successfully',
        'project_id': project_id
    }), 201

@project_bp.route('/update-project', methods=['PUT'])
def update_project():
    data = request.get_json()
    db = current_app.db

    project_id = data.get('project_id') or data.get('projectId')
    print(project_id, "type:", type(project_id))
    project_name = data.get('projectTitle') or data.get('project_name')
    #team_ids = data.get('teams', [])
    deadline = data.get('deadline')
    status = data.get('status')
    priority = data.get('priority')
    description = data.get('projectDesc') or data.get('description')
    isbillable = data.get('isbillable')
    estimated_hours = data.get('estimated_hours')

    try:
        p_id = ObjectId(project_id)
        # formatted_team_ids = []
        # for team_id in team_ids:
        #     if team_id:
        #         formatted_team_ids.append(ObjectId(team_id))

        update_data = {}
        if project_name: update_data['project_title'] = project_name
        #if team_ids is not None: update_data['team_ids'] = formatted_team_ids
        if deadline: update_data['deadline'] = deadline
        if status: update_data['status'] = status
        if priority: update_data['priority'] = priority
        if description: update_data['description'] = description
        if isbillable is not None: update_data['isbillable'] = isbillable
        if estimated_hours is not None: update_data['estimated_hours'] = float(estimated_hours)

        result = db.projects.update_one({'_id': p_id}, {'$set': update_data})

        if result.matched_count == 0:
            return jsonify({'error': 'Project not found'}), 404

        return jsonify({'message': 'Project updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Invalid Project ID or System Error: {str(e)}'}), 400

@project_bp.route('/get-project', methods=['GET'])
def get_projects():
    db = current_app.db
    projects = list(db.projects.find())
    today_str = datetime.now().strftime('%Y-%m-%d')
    for project in projects:
        p_id = project['_id']
        project['_id'] = str(p_id)
        pipeline = [
            {'$match': {'project_id': ObjectId(p_id)}},
            {'$group': {'_id': '$project_id', 'total_hours': {'$sum': '$total_logged_hours'}}}
        ]
        task_stats = list(db.tasks.aggregate(pipeline))
        project['logged_hours'] = float(task_stats[0]['total_hours']) if task_stats else 0.0
        logged_hrs = project['logged_hours']
        deadline = project.get('deadline')
        status = project.get('status')
        project['is_overdue'] = bool(
            deadline and 
            deadline < today_str and 
            status != 'Completed'
        )

        estimated_hrs = float(project.get('estimated_hours', 0))
        project['is_over_hours'] = bool(
            estimated_hrs > 0 and 
            logged_hrs > estimated_hrs
        )
        populated_teams = []
        
        if project.get('team_ids'):
            for t_id in project['team_ids']:
                team_doc = db.teams.find_one({'_id': ObjectId(str(t_id))})
                if team_doc:
                    populated_teams.append({
                        'id': str(team_doc['_id']),
                        'team_name': team_doc.get('team_name')
                    })
        
        project['team_ids'] = populated_teams

    return jsonify(projects), 200

@project_bp.route('/create-task', methods=['POST'])
def create_task():
    data = request.get_json()
    db = current_app.db

    project_id = data.get('projectId') or data.get('project_id')
    incoming_assigned_users = data.get('assigned_users', [])
    task_name = data.get('task_title')
    description = data.get('description')
    deadline = data.get('deadline')
    priority = data.get('priority')
    status = data.get('status')
    

    if not project_id:
        return jsonify({'error': 'Project ID is required'}), 400
    
    formatted_assigned_users = []
    for u_id in incoming_assigned_users:
        if u_id:
            try:
                formatted_assigned_users.append(ObjectId(u_id))
            except Exception:
                continue

    try:
        p_id = ObjectId(project_id)
        project_doc = db.projects.find_one({'_id': p_id})
        if not project_doc:
            return jsonify({'error': 'Project not found'}), 404

        new_task = {
            'project_id': p_id,
            'task_name': task_name,
            'description': description,
            'deadline': deadline,
            'priority': priority,
            'status': status,
            'assigned_users': formatted_assigned_users,
            'time_logs': [],
            'total_logged_hours': 0,
            'created_at': datetime.now()
        }

        result = db.tasks.insert_one(new_task)
        task_id = str(result.inserted_id)

        return jsonify({
            'message': 'Task created successfully',
            'task_id': task_id
        }), 201

    except Exception as e:
        return jsonify({'error': f'Invalid Project ID or System Error: {str(e)}'}), 400
    
@project_bp.route('/get-tasks', methods=['GET'])
def get_tasks():
    db = current_app.db
    tasks = list(db.tasks.find())

    for task in tasks:
        task['_id'] = str(task['_id'])
        task['project_id'] = str(task['project_id'])
        
        if task.get('created_at'):
            task['created_at'] = task['created_at'].isoformat()
        
        populated_users = []

        if task.get('assigned_users'):
            for u_id in task['assigned_users']:
                user_doc = db.employee.find_one({'_id': ObjectId(str(u_id))})
                if user_doc:
                    populated_users.append({
                        'id': str(user_doc['_id']),
                        'name': user_doc.get('name')
                    })
        
        task['assigned_users'] = populated_users

        formatted_logs = []
        if task.get('time_logs'):
            for log in task['time_logs']:
                # Find user name for time log history
                log_user = db.employee.find_one({'_id': ObjectId(str(log['user_id']))})
                u_name = log_user.get('name') if log_user else "Unknown User"
                
                formatted_logs.append({
                    'user_id': str(log['user_id']),
                    'user_name': u_name,
                    'hours': log.get('hours', 0),
                    'logged_at': log['logged_at'].isoformat() if log.get('logged_at') else None
                })
        task['time_logs'] = formatted_logs

    return jsonify(tasks), 200

@project_bp.route('/update-task', methods = ['PUT'])
def update_task():
    data = request.get_json()
    db = current_app.db
    
    task_id = data.get('task_id')
    user_id = data.get('user_id')
    hours = data.get('hours')
    assigned_users = data.get('assigned_users')

    try:
        t_id = ObjectId(task_id)
        u_id = ObjectId(user_id) if (user_id and ObjectId.is_valid(str(user_id))) else None
        logged_hours = float(hours) if (hours is not None and str(hours).strip() != '') else 0.0
        # logged_hours = float(hours) if hours is not None else 0.0
        assigned_user_ids = []
        if assigned_users is not None and isinstance(assigned_users, list):
            for item in assigned_users:
                if not item:
                    continue
                
                raw_id = item.get('_id') or item.get('id') if isinstance(item, dict) else item
                raw_id_str = str(raw_id).strip()

                if ObjectId.is_valid(raw_id_str):
                    assigned_user_ids.append(ObjectId(raw_id_str))
        else:
            assigned_user_ids = None
        # user_name = db.employee.find_one({'_id': u_id}, {'_id':0,'name': 1})
        # user_namestr = user_name['name'] if user_name else "Unknown User"
        update_query = {}
        if hours and u_id:
            new_log = {
                'user_id': u_id,
                'hours': logged_hours,
                'logged_at': datetime.now()
            }
            update_query['$push'] = {'time_logs': new_log}
            update_query['$inc'] = {'total_logged_hours': logged_hours}
        if assigned_users is not None:
            update_query['$set'] = {'assigned_users': assigned_user_ids}

        result = db.tasks.update_one({'_id': t_id}, update_query)

        if result.matched_count == 0:
            return jsonify({'error': 'Task not found'}), 404

        updated_task = db.tasks.find_one({'_id': t_id})

        if updated_task and updated_task.get('project_id'):
            sync_project_logged_hours(db, updated_task['project_id'])

        logs = updated_task.get('time_logs', [])
        user_ids = list({log.get('user_id') for log in logs if log.get('user_id')})
        users = db.employee.find({'_id': {'$in': user_ids}}, {'name': 1})
        user_map = {str(emp['_id']): emp.get('name', 'Unknown User') for emp in users}

        formatted_logs = []
        for log in logs:
            user_id = str(log['user_id'])
            formatted_logs.append({
                'user_id': user_id,
                'user_name': user_map.get(user_id, 'Unknown User'),
                'hours': log.get('hours', 0),
                'logged_at': log['logged_at'].isoformat() if log.get('logged_at') else None
            })


        if result.matched_count == 0:
            return jsonify({'error': 'Task not found'}), 404

        return jsonify({
            'message': 'Time logged successfully',
            'added_hours': logged_hours,
            'time_logged_list': formatted_logs,
            'total_logged_hours': updated_task['total_logged_hours'],
            'assigned_users': [str(uid) for uid in updated_task.get('assigned_users', [])]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'update Error: {str(e)}'}), 500


@project_bp.route('/update-task-status', methods = ['PUT'])
def update_task_status():
    data = request.get_json()
    db = current_app.db

    task_id = data.get('task_id')
    new_status = data.get('status')

    if not task_id or not new_status:
        return jsonify({'error': 'Task ID and Status are required'}), 400

    try:
        t_id = ObjectId(task_id)
        result = db.tasks.update_one(
            {'_id': t_id},
            {'$set': {'status': new_status}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Task not found'}), 404

        return jsonify({'message': 'Task status updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Invalid Task ID or System Error: {str(e)}'}), 400

@project_bp.route('/add-task-comment', methods=['POST'])
def add_task_comment():
    data = request.get_json()
    db = current_app.db

    task_id = data.get('task_id')
    comment = data.get('comment')
    commented_by = data.get('commented_by')

    if not all([task_id, comment, commented_by]):
        return jsonify({'error': 'Task ID, Comment, and Commented By are required'}), 400

    try:
        t_id = ObjectId(task_id)
        c_by = ObjectId(commented_by)

        new_comment = {
            'task_id': t_id,
            'comment': comment,
            'commented_by': c_by,
            'commented_at': datetime.now()
        }

        result = db.comments.insert_one(new_comment)

        return jsonify({
            'comment_id': str(result.inserted_id),
            'message': 'Comment added successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Invalid ID or System Error: {str(e)}'}), 400
    
@project_bp.route('/get-task-comments/<task_id>', methods=['GET'])
def get_task_comments(task_id):
    db = current_app.db
    
    try:
        t_id = ObjectId(task_id)
        comments = list(db.comments.find({'task_id': t_id}))
        
        formatted_comments = []
        for comment in comments:
            user_doc = db.employee.find_one({'_id': comment['commented_by']})
            user_name = user_doc.get('name') if user_doc else "Unknown User"

            formatted_comments.append({
                'comment_id': str(comment['_id']),
                'task_id': str(comment['task_id']),
                'comment': comment['comment'],
                'commented_by': str(comment['commented_by']),
                'commented_by_name': user_name,
                'commented_at': comment['commented_at'].isoformat() if comment.get('commented_at') else None
            })

        return jsonify(formatted_comments), 200

    except Exception as e:
        return jsonify({'error': f'Invalid Task ID or System Error: {str(e)}'}), 400