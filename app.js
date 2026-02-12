// API Configuration
const SERVICE_URL = '/api';

// State Management
let tasks = [];
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskBody = document.getElementById('task-body');
const taskModal = document.getElementById('task-modal');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const themeCheckboxes = document.querySelectorAll('.theme-checkbox');
const taskSearch = document.getElementById('task-search');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');
const emptyState = document.getElementById('empty-state');

// Statistics Elements
const totalTasksEl = document.getElementById('total-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const completedTasksEl = document.getElementById('completed-tasks');

// Theme Management
// const themeCheckbox = document.getElementById('theme-checkbox'); // Already declared at line 11

function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeCheckboxes.forEach(cb => {
        cb.checked = currentTheme === 'light';
    });
}

// Initialize App
window.initializeAppData = function () {
    fetchTasks();
    checkAdminAccess();
};

function checkAdminAccess() {
    const session = JSON.parse(localStorage.getItem('currentUser'));
    const isAdmin = session && session.username.toLowerCase() === 'admin_00';

    // Header Admin Button
    const adminBtn = document.getElementById('admin-dash-btn');
    if (adminBtn) adminBtn.classList.toggle('hidden', !isAdmin);

    // Migration Modal Cleanup Section
    const cleanupSection = document.getElementById('admin-cleanup-section');
    if (cleanupSection) cleanupSection.classList.toggle('hidden', !isAdmin);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. apply theme immediately
    applyTheme();

    // 2. Attach listeners
    themeCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            currentTheme = cb.checked ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme);
            applyTheme();
        });
    });

    if (themeCheckboxes.length === 0) {
        console.warn('No theme checkboxes found in DOM');
    }

    // 3. Check Session
    const session = JSON.parse(localStorage.getItem('currentUser'));
    if (session) {
        initializeAppData();
    }
});

// Modal Logic
openModalBtn.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Create New Task';
    document.getElementById('edit-id').value = '';
    taskForm.reset();
    taskModal.classList.add('active');
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) modal.classList.remove('active');
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============ TASK OPERATIONS (API) ============

async function fetchTasks() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    try {
        const response = await fetch(`${SERVICE_URL}/tasks?username=${user.username}`);
        const data = await response.json();

        if (data.tasks) {
            tasks = data.tasks;
            renderTasks();
            updateStats();
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const editId = document.getElementById('edit-id').value;
    const taskData = {
        id: editId || Date.now().toString(),
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        dueDate: document.getElementById('due-date').value,
        status: editId ? (tasks.find(t => t.id == editId).status) : 'pending',
        createdAt: editId ? (tasks.find(t => t.id == editId).createdAt) : new Date().toISOString()
    };

    try {
        if (editId) {
            // Update existing
            const response = await fetch(`${SERVICE_URL}/tasks/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, task: taskData })
            });
            if (response.ok) {
                const data = await response.json();
                tasks = data.tasks;
            }
        } else {
            // Create new
            const response = await fetch(`${SERVICE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, task: taskData })
            });
            if (response.ok) {
                const data = await response.json();
                tasks = data.tasks; // API returns updated list
            }
        }

        renderTasks();
        updateStats();
        taskModal.classList.remove('active');
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Network error.');
    }
});

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    try {
        const response = await fetch(`${SERVICE_URL}/tasks/${id}?username=${user.username}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            tasks = data.tasks;
            renderTasks();
            updateStats();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task.');
    }
}

async function toggleStatus(id) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const task = tasks.find(t => t.id == id);
    if (!task) return;

    const updatedTask = { ...task, status: task.status === 'pending' ? 'completed' : 'pending' };

    try {
        const response = await fetch(`${SERVICE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, task: updatedTask })
        });

        if (response.ok) {
            const data = await response.json();
            tasks = data.tasks;
            renderTasks();
            updateStats();
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Expose to window for inline onclicks
window.toggleStatus = toggleStatus;
window.editTask = editTask;
window.deleteTask = deleteTask;

function editTask(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    // Handle both naming possibilities
    const dueDate = task.dueDate || task.due_date;

    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('edit-id').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('priority').value = task.priority;

    // Safely format date for the input field (handled whether it's a string or Date object)
    if (dueDate) {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) {
            document.getElementById('due-date').value = d.toISOString().split('T')[0];
        } else {
            document.getElementById('due-date').value = '';
        }
    } else {
        document.getElementById('due-date').value = '';
    }

    taskModal.classList.add('active');
}

// Settings Modal Logic (UI Only - Logic handled in auth.js)
const settingsModal = document.getElementById('settings-modal');
const settingsOpenBtn = document.getElementById('settings-open-btn');
const togglePasswordFormBtn = document.getElementById('toggle-password-form');
const passwordFormContainer = document.getElementById('password-form-container');

if (settingsOpenBtn) {
    settingsOpenBtn.addEventListener('click', () => {
        populateAccountDetails();
        if (passwordFormContainer) passwordFormContainer.classList.add('hidden');
        if (togglePasswordFormBtn) togglePasswordFormBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
        settingsModal.classList.add('active');
    });
}

if (togglePasswordFormBtn) {
    togglePasswordFormBtn.addEventListener('click', () => {
        const isHidden = passwordFormContainer.classList.toggle('hidden');
        togglePasswordFormBtn.innerHTML = isHidden ?
            '<i class="fas fa-key"></i> Update Password' :
            '<i class="fas fa-times"></i> Cancel Update';

        if (!isHidden) {
            document.getElementById('change-password-form').reset();
            document.getElementById('pass-error').classList.add('hidden');
            document.getElementById('pass-success').classList.add('hidden');
        }
    });
}

function populateAccountDetails() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('prof-username').textContent = user.username;
        document.getElementById('prof-email').textContent = user.email;
    }
}

// Search and Filtering
function renderTasks() {
    const searchTerm = taskSearch.value.toLowerCase();
    const statusVal = filterStatus.value;
    const priorityVal = filterPriority.value;

    const filtered = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);
        const matchesStatus = statusVal === 'all' || task.status === statusVal;
        const matchesPriority = priorityVal === 'all' || task.priority === priorityVal;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    taskBody.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        document.getElementById('task-table').classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        document.getElementById('task-table').classList.remove('hidden');

        filtered.forEach(task => {
            const tr = document.createElement('tr');
            if (task.status === 'completed') tr.classList.add('completed');

            tr.innerHTML = `
                <td class="col-status">
                    <div class="status-dot ${task.status}" 
                         onclick="toggleStatus('${task.id}')" 
                         title="Mark as ${task.status === 'pending' ? 'Completed' : 'Pending'}">
                    </div>
                </td>
                <td class="col-title">
                    <span class="task-title">${task.title}</span>
                    <span class="task-desc">${task.description || 'No description'}</span>
                </td>
                <td class="col-priority">
                    <span class="badge badge-${task.priority}">${task.priority}</span>
                </td>
                <td class="col-due">
                    ${(task.dueDate || task.due_date) ? formatDate(task.dueDate || task.due_date) : '<span class="text-muted">No date</span>'}
                </td>
                <td class="col-actions">
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" onclick="editTask('${task.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            taskBody.appendChild(tr);
        });
    }
}

// Search/Filter Event Listeners
taskSearch.addEventListener('input', renderTasks);
filterStatus.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);

// Migration Logic
const migrationModal = document.getElementById('migration-modal');
const migrationOpenBtn = document.getElementById('migration-open-btn');
const exportBtn = document.getElementById('export-btn');
const importTriggerBtn = document.getElementById('import-trigger-btn');
const importFile = document.getElementById('import-file');

if (migrationOpenBtn) {
    migrationOpenBtn.addEventListener('click', () => {
        migrationModal.classList.add('active');
    });
}

// Export/Import still uses Client logic but effectively works with what's loaded
// (Refactoring this to use backend would be complex, keeping simple JSON export of current view for now or omitting if not critical. 
//  Let's keep generic JSON export of what's in memory/local for simplicity, but strictly speaking "Migration" in a backend app is different.)
//  For now, I'll update export to dump current 'tasks' variable.

function exportData() {
    // Export only current user tasks for now
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import logic needs to post to backend
importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (!Array.isArray(importedTasks)) throw new Error('Invalid format');

            if (confirm(`Importing ${importedTasks.length} tasks. Continue?`)) {
                // Sequentially add tasks
                for (const task of importedTasks) {
                    await fetch(`${SERVICE_URL}/tasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: user.username, task })
                    });
                }
                alert('Import complete!');
                fetchTasks(); // Reload
                migrationModal.classList.remove('active');
            }
        } catch (err) {
            alert('Error parsing backup file.');
            console.error(err);
        }
    };
    reader.readAsText(file);
});

if (exportBtn) exportBtn.addEventListener('click', exportData);
if (importTriggerBtn) importTriggerBtn.addEventListener('click', () => importFile.click());


const cleanupBtn = document.getElementById('cleanup-btn');

// Admin Dashboard Modal Logic
const adminModal = document.getElementById('admin-modal');
const adminDashBtn = document.getElementById('admin-dash-btn');
const adminUserBody = document.getElementById('admin-user-body');

if (adminDashBtn) {
    adminDashBtn.addEventListener('click', () => {
        renderAdminDashboard();
        adminModal.classList.add('active');
    });
}

async function renderAdminDashboard() {
    const targetBody = document.getElementById('admin-user-body');
    if (!targetBody) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.username.toLowerCase() !== 'admin_00') return;

    targetBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch(`${SERVICE_URL}/admin/users?adminUsername=${user.username}`);
        const data = await response.json();

        if (data.users) {
            const users = data.users;

            // Sort: Admin first
            users.sort((a, b) => {
                const nameA = (a.username || '').toLowerCase();
                const nameB = (b.username || '').toLowerCase();
                if (nameA === 'admin_00') return -1;
                if (nameB === 'admin_00') return 1;
                return 0;
            });

            targetBody.innerHTML = '';

            users.forEach(u => {
                const tr = document.createElement('tr');
                const isSelf = (u.username || '').toLowerCase() === 'admin_00';

                tr.innerHTML = `
                    <td><strong>${u.username}</strong> ${isSelf ? '<span class="badge badge-low">Admin</span>' : ''}</td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.taskCount > 0 ? 'badge-high' : 'badge-low'}">${u.taskCount} Tasks</span></td>
                    <td><span class="credential-field">******</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon btn-edit" onclick="viewUserSpecificTasks('${u.username}')" title="View User Tasks">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${!isSelf ? `
                                <button class="btn-icon btn-delete" onclick="deleteSpecificUser('${u.username}')" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : '<span class="text-muted" style="margin-left: 10px;">Protected</span>'}
                        </div>
                    </td>
                `;
                targetBody.appendChild(tr);
            });

            // Cleanup Button Row
            if (users.length > 1) {
                const resetRow = document.createElement('tr');
                resetRow.innerHTML = `
                    <td colspan="5" class="text-center" style="padding: 1.5rem 0;">
                        <button class="btn-danger" style="padding: 0.6rem 1.2rem; border-radius: 8px;" onclick="cleanupAccounts()">
                            <i class="fas fa-exclamation-triangle"></i> Wipe All User Data
                        </button>
                    </td>
                `;
                targetBody.appendChild(resetRow);
            }
        }
    } catch (error) {
        console.error('Admin Load Error:', error);
        targetBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading users.</td></tr>';
    }
}

window.deleteSpecificUser = async function (username) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
        const response = await fetch(`${SERVICE_URL}/admin/users/${username}?adminUsername=${user.username}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert(`User "${username}" deleted.`);
            renderAdminDashboard();
        } else {
            alert('Failed to delete user.');
        }
    } catch (error) {
        console.error('Delete user error:', error);
    }
};

window.viewUserSpecificTasks = async function (username) {
    const modal = document.getElementById('user-tasks-modal');
    const titleEl = document.getElementById('admin-view-username');
    const bodyEl = document.getElementById('admin-user-tasks-body');
    const emptyState = document.getElementById('admin-empty-user-state');
    const table = bodyEl.closest('table');

    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = username;
    bodyEl.innerHTML = '';

    // Using the same Get Tasks endpoint
    try {
        const response = await fetch(`${SERVICE_URL}/tasks?username=${username}`);
        const data = await response.json();
        const userTasks = data.tasks || [];

        if (userTasks.length === 0) {
            emptyState.classList.remove('hidden');
            table.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            table.classList.remove('hidden');

            userTasks.forEach(task => {
                const tr = document.createElement('tr');
                if (task.status === 'completed') tr.classList.add('completed');

                tr.innerHTML = `
                    <td><div class="status-dot ${task.status}"></div></td>
                    <td>
                        <span class="task-title">${task.title}</span>
                        <span class="task-desc">${task.description || 'No description'}</span>
                    </td>
                    <td><span class="badge badge-${task.priority}">${task.priority}</span></td>
                    <td>${(task.dueDate || task.due_date) ? formatDate(task.dueDate || task.due_date) : '<span class="text-muted">No date</span>'}</td>
                `;
                bodyEl.appendChild(tr);
            });
        }
        modal.classList.add('active');
    } catch (error) {
        console.error('Error viewing tasks:', error);
        alert('Could not load user tasks.');
    }
};

async function cleanupAccounts() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    if (!confirm('Start full system cleanup? This deletes ALL users except Admin.')) return;

    try {
        const response = await fetch(`${SERVICE_URL}/admin/cleanup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminUsername: user.username })
        });

        if (response.ok) {
            alert('Cleanup successful.');
            renderAdminDashboard();
        } else {
            alert('Cleanup failed.');
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

if (cleanupBtn) cleanupBtn.addEventListener('click', cleanupAccounts);

// Utils
function updateStats() {
    totalTasksEl.textContent = tasks.length;
    pendingTasksEl.textContent = tasks.filter(t => t.status === 'pending').length;
    completedTasksEl.textContent = tasks.filter(t => t.status === 'completed').length;
}

function formatDate(dateStr) {
    if (!dateStr) return '<span class="text-muted">No date</span>';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '<span class="text-muted">No date</span>';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}
