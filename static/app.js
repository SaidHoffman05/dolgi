document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    }

    document.getElementById('login-btn')?.addEventListener('click', login);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('add-debt-btn')?.addEventListener('click', showAddDebtModal);
    document.getElementById('add-user-btn')?.addEventListener('click', showAddUserModal);
});

let currentUser = null;
let currentDebtId = null;
let currentUserId = null;

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showError('login-error', 'Заполните все поля');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            currentUser = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
        } else {
            const error = await response.json();
            showError('login-error', error.error || 'Неверные учетные данные');
        }
    } catch (e) {
        showError('login-error', 'Ошибка соединения с сервером');
        console.error("Ошибка входа:", e);
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showLogin();
}

function showApp() {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('app').classList.remove('d-none');
    updateUIForRole();
    loadDebts();
    loadUsers();
}

function showLogin() {
    document.getElementById('login-form').classList.remove('d-none');
    document.getElementById('app').classList.add('d-none');
}

function updateUIForRole() {
    if (!currentUser) {
        console.error("Текущий пользователь не определен!");
        return;
    }

    // Обновляем отображение роли
    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl) {
        userInfoEl.textContent = `${currentUser.username} (${getRoleName(currentUser.role)})`;
    }

    // Включаем все admin-only элементы для владельца
    const isAdmin = currentUser.role.toLowerCase() === 'admin';
    const isOwner = currentUser.role.toLowerCase() === 'owner';

    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = (isAdmin || isOwner) ? 'block' : 'none';
    });

    // Специальные элементы только для владельца
    document.querySelectorAll('.owner-only').forEach(el => {
        el.style.display = isOwner ? 'block' : 'none';
    });

    console.log('Права обновлены:', {
        username: currentUser.username,
        role: currentUser.role,
        isAdmin,
        isOwner
    });
}
function getRoleName(role) {
    const roles = {
        'owner': 'Владелец',
        'admin': 'Администратор',
        'user': 'Пользователь'
    };
    return roles[role] || role;
}

async function loadDebts() {
    try {
        const response = await fetch('/api/debts');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const debts = await response.json();
        
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
    } catch (e) {
        console.error("Ошибка загрузки долгов:", e);
        showError('global-error', 'Не удалось загрузить список долгов');
    }
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU');
}

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

async function editDebt(id) {
    try {
        const response = await fetch(`/api/debts/${id}`);
        const debt = await response.json();

        if (debt) {
            currentDebtId = id;
            document.getElementById('debtModalTitle').textContent = 'Редактировать долг';
            document.getElementById('debt-from').value = debt.from_name || debt.from_user;
            document.getElementById('debt-to').value = debt.to_name || debt.to_user;
            document.getElementById('debt-amount').value = debt.amount;
            document.getElementById('debt-paid').value = debt.paid;
            document.getElementById('debt-description').value = debt.description || '';
            hideError('debt-error');

            new bootstrap.Modal(document.getElementById('debtModal')).show();
        }
    } catch (e) {
        console.error("Ошибка редактирования долга:", e);
    }
}

async function editDebt(id) {
    try {
        const response = await fetch(`/api/debts/${id}`);
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const debt = await response.json();
        
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
    } catch (e) {
        console.error("Ошибка редактирования долга:", e);
        showError('global-error', 'Не удалось загрузить данные долга');
    }
}

async function saveDebt() {
    const debtData = {
        from_user: document.getElementById('debt-from').value.trim(),
        to_user: document.getElementById('debt-to').value.trim(),
        amount: parseFloat(document.getElementById('debt-amount').value),
        paid: parseFloat(document.getElementById('debt-paid').value) || 0,
        description: document.getElementById('debt-description').value.trim()
    };

    // Валидация
    if (!debtData.from_user || !debtData.to_user || isNaN(debtData.amount)) {
        showError('debt-error', 'Заполните все обязательные поля');
        return;
    }

    try {
        const url = currentDebtId ? `/api/debts/${currentDebtId}` : '/api/debts';
        const method = currentDebtId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(debtData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сервера');
        }

        const result = await response.json();
        console.log('Долг сохранен:', result);
        
        bootstrap.Modal.getInstance(document.getElementById('debtModal')).hide();
        loadDebts();
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showError('debt-error', error.message);
    }
}

async function deleteDebt(id) {
    if (confirm('Вы уверены, что хотите удалить этот долг?')) {
        try {
            const response = await fetch(`/api/debts/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadDebts();
            } else {
                const error = await response.json();
                alert(error.error || 'Ошибка удаления');
            }
        } catch (e) {
            console.error("Ошибка удаления долга:", e);
        }
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const users = await response.json();
        
        const table = document.getElementById('users-table');
        if (!table) return;
        
        table.innerHTML = users.map(user => `
            <tr>
                <td>${user.username || 'Неизвестно'}</td>
                <td>${getRoleName(user.role)}</td>
                <td>${formatDate(user.created_at)}</td>
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
    } catch (e) {
        console.error("Ошибка загрузки пользователей:", e);
        showError('global-error', 'Не удалось загрузить список пользователей');
    }
}

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

async function editUser(id) {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }
        
        const user = await response.json();
        if (user) {
            currentUserId = id;
            document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-password').value = '';
            document.getElementById('user-role').value = user.role;
            hideError('user-error');

            // Скрываем опцию owner если текущий пользователь не владелец
            if (currentUser?.role !== 'owner') {
                document.querySelector('#user-role option[value="owner"]').style.display = 'none';
            }

            new bootstrap.Modal(document.getElementById('userModal')).show();
        }
    } catch (e) {
        console.error("Ошибка редактирования пользователя:", e);
        showError('global-error', 'Не удалось загрузить данные пользователя');
    }
}
async function saveUser() {
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    if (!username) {
        showError('user-error', 'Введите логин');
        return;
    }

    try {
        const method = currentUserId ? 'PUT' : 'POST';
        const url = currentUserId ? `/api/users/${currentUserId}` : '/api/users';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password: password || undefined,
                role
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сохранения');
        }

        const result = await response.json();
        console.log('Пользователь сохранен:', result);
        
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        loadUsers();

        // Обновляем текущего пользователя если редактировали себя
        if (currentUserId === currentUser?.id) {
            const userResponse = await fetch(`/api/users/${currentUser.id}`);
            currentUser = await userResponse.json();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForRole();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showError('user-error', error.message);
    }
}

async function deleteUser(id) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        try {
            const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadUsers();
            } else {
                const error = await response.json();
                alert(error.error || 'Нельзя удалить пользователя с активными долгами');
            }
        } catch (e) {
            console.error("Ошибка удаления пользователя:", e);
        }
    }
}

// Калькулятор
let calcValue = '0';
let calcCurrentOperation = null; // Было calcOperation, переименовано
let calcPrevValue = null;

function calcInput(value) {
    if (calcValue === '0' && value !== '.') {
        calcValue = value;
    } else {
        calcValue += value;
    }
    document.getElementById('calc-display').textContent = calcValue;
}

function setCalcOperation(op) { // Было calcOperation, переименовано
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