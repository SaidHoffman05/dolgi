document.addEventListener('DOMContentLoaded', () => {
    // Инициализация базы данных
    initDatabase();
    
    // Проверка авторизованного пользователя
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    }

    // Назначение обработчиков событий
    document.getElementById('login-btn')?.addEventListener('click', login);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('add-debt-btn')?.addEventListener('click', showAddDebtModal);
    document.getElementById('add-user-btn')?.addEventListener('click', showAddUserModal);
});

// Глобальные переменные
let currentUser = null;
let currentDebtId = null;
let currentUserId = null;

// Инициализация базы данных
function initDatabase() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { 
                id: 1, 
                username: 'admin', 
                password: 'admin123',  // В реальном приложении пароль должен быть хэширован
                role: 'owner', 
                created_at: new Date().toISOString() 
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem('debts')) {
        localStorage.setItem('debts', JSON.stringify([]));
    }
}

// Функция входа в систему
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showError('login-error', 'Заполните все поля');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showApp();
    } else {
        showError('login-error', 'Неверный логин или пароль');
    }
}

// Функция выхода из системы
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showLogin();
}

// Показать основное приложение
function showApp() {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('app').classList.remove('d-none');
    updateUIForRole();
    loadDebts();
    loadUsers();
}

// Показать форму входа
function showLogin() {
    document.getElementById('login-form').classList.remove('d-none');
    document.getElementById('app').classList.add('d-none');
}

// Обновление интерфейса в зависимости от роли
function updateUIForRole() {
    if (!currentUser) return;

    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl) {
        userInfoEl.textContent = `${currentUser.username} (${getRoleName(currentUser.role)})`;
    }

    const isAdmin = ['admin', 'owner'].includes(currentUser.role.toLowerCase());
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });
}

// Загрузка списка долгов
function loadDebts() {
    const debts = JSON.parse(localStorage.getItem('debts')) || [];
    const table = document.getElementById('debts-table');
    
    table.innerHTML = debts.map(debt => `
        <tr>
            <td>${debt.from_user}</td>
            <td>${debt.to_user}</td>
            <td>${debt.amount.toFixed(2)} ₽</td>
            <td>${debt.paid.toFixed(2)} ₽</td>
            <td>${(debt.amount - debt.paid).toFixed(2)} ₽</td>
            <td>${debt.description || '-'}</td>
            <td>${new Date(debt.created_at).toLocaleDateString('ru-RU')}</td>
            <td class="admin-only">
                <button class="btn btn-sm btn-warning me-2" onclick="editDebt(${debt.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteDebt(${debt.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Показать модальное окно для добавления долга
function showAddDebtModal() {
    currentDebtId = null;
    document.getElementById('debtModalTitle').textContent = 'Добавить долг';
    document.getElementById('debt-from').value = '';
    document.getElementById('debt-to').value = '';
    document.getElementById('debt-amount').value = '';
    document.getElementById('debt-paid').value = '0';
    document.getElementById('debt-description').value = '';
    hideError('debt-error');

    new bootstrap.Modal(document.getElementById('debtModal')).show();
}

// Редактировать долг
function editDebt(id) {
    const debts = JSON.parse(localStorage.getItem('debts'));
    const debt = debts.find(d => d.id === id);

    if (debt) {
        currentDebtId = id;
        document.getElementById('debtModalTitle').textContent = 'Редактировать долг';
        document.getElementById('debt-from').value = debt.from_user;
        document.getElementById('debt-to').value = debt.to_user;
        document.getElementById('debt-amount').value = debt.amount;
        document.getElementById('debt-paid').value = debt.paid;
        document.getElementById('debt-description').value = debt.description || '';
        hideError('debt-error');

        new bootstrap.Modal(document.getElementById('debtModal')).show();
    }
}

// Сохранить долг
function saveDebt() {
    const debtData = {
        id: currentDebtId || Date.now(),
        from_user: document.getElementById('debt-from').value.trim(),
        to_user: document.getElementById('debt-to').value.trim(),
        amount: parseFloat(document.getElementById('debt-amount').value),
        paid: parseFloat(document.getElementById('debt-paid').value) || 0,
        description: document.getElementById('debt-description').value.trim(),
        created_at: currentDebtId ? 
            JSON.parse(localStorage.getItem('debts')).find(d => d.id === currentDebtId).created_at : 
            new Date().toISOString()
    };

    if (!debtData.from_user || !debtData.to_user || isNaN(debtData.amount)) {
        showError('debt-error', 'Заполните все обязательные поля');
        return;
    }

    let debts = JSON.parse(localStorage.getItem('debts'));
    
    if (currentDebtId) {
        const index = debts.findIndex(d => d.id === currentDebtId);
        debts[index] = debtData;
    } else {
        debts.push(debtData);
    }

    localStorage.setItem('debts', JSON.stringify(debts));
    bootstrap.Modal.getInstance(document.getElementById('debtModal')).hide();
    loadDebts();
}

// Удалить долг
function deleteDebt(id) {
    if (confirm('Вы уверены, что хотите удалить этот долг?')) {
        let debts = JSON.parse(localStorage.getItem('debts'));
        debts = debts.filter(d => d.id !== id);
        localStorage.setItem('debts', JSON.stringify(debts));
        loadDebts();
    }
}

// Загрузка списка пользователей
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users'));
    const table = document.getElementById('users-table');
    
    if (!table) return;
    
    table.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${getRoleName(user.role)}</td>
            <td>${new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
            <td>
                ${currentUser?.role === 'owner' ? `
                <button class="btn btn-sm btn-warning me-2" onclick="editUser(${user.id})" ${user.id === 1 ? 'disabled' : ''}>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})" ${user.id === currentUser?.id ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Показать модальное окно для добавления пользователя
function showAddUserModal() {
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
    document.getElementById('user-username').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = 'user';
    hideError('user-error');

    if (currentUser?.role !== 'owner') {
        document.querySelector('#user-role option[value="owner"]').style.display = 'none';
    }

    new bootstrap.Modal(document.getElementById('userModal')).show();
}

// Редактировать пользователя
function editUser(id) {
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.id === id);

    if (user) {
        currentUserId = id;
        document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-password').value = '';
        document.getElementById('user-role').value = user.role;
        hideError('user-error');

        if (currentUser?.role !== 'owner') {
            document.querySelector('#user-role option[value="owner"]').style.display = 'none';
        }

        new bootstrap.Modal(document.getElementById('userModal')).show();
    }
}

// Сохранить пользователя
function saveUser() {
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    if (!username) {
        showError('user-error', 'Введите логин');
        return;
    }

    if (!currentUserId && !password) {
        showError('user-error', 'Введите пароль');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users'));
    const userData = {
        id: currentUserId || Date.now(),
        username,
        password: password || users.find(u => u.id === currentUserId).password,
        role,
        created_at: currentUserId ? 
            users.find(u => u.id === currentUserId).created_at : 
            new Date().toISOString()
    };

    if (currentUserId) {
        const index = users.findIndex(u => u.id === currentUserId);
        users[index] = userData;
    } else {
        users.push(userData);
    }

    localStorage.setItem('users', JSON.stringify(users));
    bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
    loadUsers();

    // Обновляем текущего пользователя если редактировали себя
    if (currentUserId === currentUser?.id) {
        currentUser = {
            id: userData.id,
            username: userData.username,
            role: userData.role
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForRole();
    }
}

// Удалить пользователя
function deleteUser(id) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        let users = JSON.parse(localStorage.getItem('users'));
        users = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(users));
        loadUsers();
    }
}

// Вспомогательные функции
function getRoleName(role) {
    const roles = {
        'owner': 'Владелец',
        'admin': 'Администратор',
        'user': 'Пользователь'
    };
    return roles[role] || role;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('d-none');
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('d-none');
    }
}

// Логика калькулятора
let calcValue = '0';
let calcCurrentOperation = null;
let calcPrevValue = null;

function calcInput(value) {
    if (calcValue === '0' && value !== '.') {
        calcValue = value;
    } else {
        calcValue += value;
    }
    document.getElementById('calc-display').textContent = calcValue;
}

function setCalcOperation(op) {
    calcPrevValue = parseFloat(calcValue);
    calcCurrentOperation = op;
    calcValue = '0';
}

function clearCalc() {
    calcValue = '0';
    calcCurrentOperation = null;
    calcPrevValue = null;
    document.getElementById('calc-display').textContent = calcValue;
}

function calculate() {
    if (!calcCurrentOperation || calcPrevValue === null) return;

    const currentValue = parseFloat(calcValue);
    let result;

    switch (calcCurrentOperation) {
        case '+': result = calcPrevValue + currentValue; break;
        case '-': result = calcPrevValue - currentValue; break;
        case '*': result = calcPrevValue * currentValue; break;
        case '/': result = calcPrevValue / currentValue; break;
        default: return;
    }

    calcValue = result.toString();
    document.getElementById('calc-display').textContent = calcValue;
    calcCurrentOperation = null;
    calcPrevValue = null;
}