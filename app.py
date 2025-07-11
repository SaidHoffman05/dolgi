from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from database import Database
import sqlite3

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всех доменов

# Инициализация базы данных
db = Database('family_debts.db')

@app.route('/')
def index():
    return render_template('index.html')  # Обрабатывает Jinja2 шаблоны

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = db.get_user_by_credentials(data['username'], data['password'])
    if user:
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'role': user['role']
        })
    return jsonify({'error': 'Неверный логин или пароль'}), 401

@app.route('/api/users', methods=['GET'])
def get_users():
    users = db.get_all_users()
    return jsonify(users)

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = db.get_user_by_id(user_id)
    if user:
        return jsonify(user)
    return jsonify({'error': 'Пользователь не найден'}), 404

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.get_json()
    user_id = db.add_user(
        data['username'],
        data['password'],
        data.get('role', 'user')
    )
    if user_id:
        return jsonify({'id': user_id}), 201
    return jsonify({'error': 'Ошибка при добавлении пользователя'}), 400

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    success = db.update_user(
        user_id,
        data['username'],
        data.get('password'),
        data.get('role')
    )
    if success:
        return jsonify({'success': True})
    return jsonify({'error': 'Ошибка при обновлении пользователя'}), 400

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    success = db.delete_user(user_id)
    if success:
        return jsonify({'success': True})
    return jsonify({'error': 'Ошибка при удалении пользователя'}), 400

@app.route('/api/debts', methods=['GET'])
def get_debts():
    debts = db.get_all_debts()
    return jsonify(debts)

@app.route('/api/debts', methods=['POST'])
def add_debt():
    data = request.get_json()
    debt_id = db.add_debt(
        data['from_user'],
        data['to_user'],
        data['amount'],
        data.get('paid', 0),
        data.get('description', '')
    )
    if debt_id:
        return jsonify({'id': debt_id}), 201
    return jsonify({'error': 'Ошибка при добавлении долга'}), 400

@app.route('/api/debts/<int:debt_id>', methods=['GET'])
def get_debt(debt_id):
    debt = db.get_debt_by_id(debt_id)
    if debt:
        return jsonify(debt)
    return jsonify({'error': 'Долг не найден'}), 404

@app.route('/api/debts/<int:debt_id>', methods=['PUT'])
def update_debt(debt_id):
    data = request.get_json()
    try:
        success = db.update_debt(
            debt_id,
            data['from_user'],
            data['to_user'],
            float(data['amount']),
            float(data.get('paid', 0)),
            data.get('description', '')
        )
        if success:
            return jsonify({'success': True})
        return jsonify({'error': 'Ошибка обновления'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debts/<int:debt_id>', methods=['DELETE'])
def delete_debt(debt_id):
    success = db.delete_debt(debt_id)
    if success:
        return jsonify({'success': True})
    return jsonify({'error': 'Ошибка при удалении долга'}), 400

if __name__ == '__main__':
    app.run(debug=True)