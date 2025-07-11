import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

class Database:
    def __init__(self, db_path):
        self.db_path = db_path
        self.initialize_database()

    def initialize_database(self):
        """Создает структуру базы данных при первом запуске"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Таблица пользователей
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Таблица долгов
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS debts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_user TEXT NOT NULL,
                    to_user TEXT NOT NULL,
                    amount REAL NOT NULL,
                    paid REAL DEFAULT 0,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Добавляем администратора по умолчанию
            cursor.execute('''
                INSERT OR IGNORE INTO users (username, password, role)
                VALUES (?, ?, ?)
            ''', ('admin', generate_password_hash('admin123'), 'owner'))
            
            conn.commit()

    def get_user_by_credentials(self, username, password):
        """Проверяет логин/пароль и возвращает пользователя"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            if user and check_password_hash(user['password'], password):
                return dict(user)
            return None

    def get_all_users(self):
        """Возвращает всех пользователей"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users ORDER BY username')
            return [dict(row) for row in cursor.fetchall()]

    def get_user_by_id(self, user_id):
        """Возвращает пользователя по ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, username, role, created_at 
                FROM users WHERE id = ?
            ''', (user_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def add_user(self, username, password, role='user'):
        """Добавляет нового пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO users (username, password, role)
                    VALUES (?, ?, ?)
                ''', (username, generate_password_hash(password), role))
                conn.commit()
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    def update_user(self, user_id, username, password=None, role=None):
        """Обновляет данные пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                if password:
                    cursor.execute('''
                        UPDATE users SET
                            username = ?,
                            password = ?,
                            role = ?
                        WHERE id = ?
                    ''', (username, generate_password_hash(password), role, user_id))
                else:
                    cursor.execute('''
                        UPDATE users SET
                            username = ?,
                            role = ?
                        WHERE id = ?
                    ''', (username, role, user_id))
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error:
            return False

    def delete_user(self, user_id):
        """Удаляет пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error:
            return False

    def get_all_debts(self):
        """Возвращает все долги"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM debts ORDER BY created_at DESC')
            return [dict(row) for row in cursor.fetchall()]

    def add_debt(self, from_user, to_user, amount, paid=0, description=''):
        """Добавляет новый долг"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO debts (from_user, to_user, amount, paid, description)
                    VALUES (?, ?, ?, ?, ?)
                ''', (from_user, to_user, amount, paid, description))
                conn.commit()
                return cursor.lastrowid
        except sqlite3.Error:
            return None

    def get_debt_by_id(self, debt_id):
        """Возвращает долг по ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def update_debt(self, debt_id, from_user, to_user, amount, paid, description):
        """Обновляет данные долга"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE debts SET
                        from_user = ?,
                        to_user = ?,
                        amount = ?,
                        paid = ?,
                        description = ?
                    WHERE id = ?
                ''', (from_user, to_user, amount, paid, description, debt_id))
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error:
            return False

    def delete_debt(self, debt_id):
        """Удаляет долг"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM debts WHERE id = ?', (debt_id,))
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error:
            return False