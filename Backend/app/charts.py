from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timezone
from datetime import timedelta

chart_bp = Blueprint('charts', __name__)

@chart_bp.route('/resource-utilization/<teamId>', methods=['GET'])
def get_resource_utilization(teamId):
    db = current_app.db
    match_query = {}
    if teamId and teamId.lower() != "all":
        try:
            match_query['team_ids'] = ObjectId(teamId)
        except:
            return jsonify({'error': 'Invalid team ID format'}), 400
    
    pipeline = [
        {   
            "$match": match_query
        },
        {
            "$group": {
                "_id": {
                    "year_month": { "$dateToString": { "format": "%b %Y", "date": "$created_at" } },
                    "is_billable": "$isbillable"
                },
                "count": { "$sum": 1 }
            }
        },
        {
            "$group": {
                "_id": "$_id.year_month",
                "Billable": {
                    "$sum": {
                        "$cond": [{ "$eq": ["$_id.is_billable", True] }, "$count", 0]
                    }
                },
                "Internal": {
                    "$sum": {
                        "$cond": [{ "$ne": ["$_id.is_billable", True] }, "$count", 0]
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "month": "$_id",
                "Billable": 1,
                "Internal": 1
            }
        }
    ]
    
    chart_data = list(db.projects.aggregate(pipeline))
    
    return jsonify(chart_data), 200

@chart_bp.route('/get-project-status/<userId>', methods=['GET'])
def get_project_status(userId):
    db = current_app.db
    match_query = {}
    if userId and userId.lower() != "all":
        try:
            match_query['assigned_users'] = ObjectId(userId)
        except:
            return jsonify({'error': 'Invalid team ID format'}), 400
    
    pipeline = [
        {
            '$match': match_query
        },
        {
            '$group': {
                '_id': '$status', 
                'count': {
                    '$sum': 1
                }
            }
        }, {
            '$project': {
                '_id': 0, 
                'status': '$_id', 
                'count': 1
            }
        }
    ]

    status_data = list(db.tasks.aggregate(pipeline))
    return jsonify(status_data), 200

@chart_bp.route('/weekly-hours/<user_id>', methods=['GET'])
def get_weekly_hours(user_id):
    db = current_app.db

    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return jsonify({'error': 'Invalid user ID format'}), 400

    try:
        today = datetime.now()
        
        current_monday = today.date() - timedelta(days=today.weekday())
        current_monday_str = current_monday.strftime('%Y-%m-%d')

        def get_data_for_week(start_date_str):
            end_date = datetime.strptime(start_date_str, '%Y-%m-%d') + timedelta(days=6)
            end_date_str = end_date.strftime('%Y-%m-%d')

            pipeline = [
                {
                    '$match': {
                        'user_id': user_object_id,
                        'date': {
                            '$gte': start_date_str,
                            '$lte': end_date_str
                        }
                    }
                }, 
                {
                    '$group': {
                        '_id': {
                            '$dayOfWeek': {
                                '$dateFromString': {
                                    'dateString': '$date'
                                }
                            }
                        }, 
                        'total_hours': {
                            '$sum': '$hours_logged'
                        }
                    }
                }
            ]
            return list(db.attandance.aggregate(pipeline))

        weekly_data = get_data_for_week(current_monday_str)
        

        if not weekly_data:
            last_monday_str = (current_monday - timedelta(days=7)).strftime('%Y-%m-%d')
            weekly_data = get_data_for_week(last_monday_str)

        day_map = { 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri' }
        formatted_data = []
        for day_num, day_name in day_map.items():
            day_data = next((item for item in weekly_data if item['_id'] == day_num), None)
            hours = round(day_data['total_hours'], 2) if day_data else 0
            
            formatted_data.append({
                'name': day_name,
                'hours': hours
            })

        return jsonify(formatted_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500