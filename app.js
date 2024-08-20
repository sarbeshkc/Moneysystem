// Simulated JSON file storage using localStorage
const USER_DATA_KEY = 'meropaisa_user_data';

// Initialize user data in localStorage if it doesn't exist
if (!localStorage.getItem(USER_DATA_KEY)) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({}));
}

// Get current user email from localStorage (set during login)
let currentUserEmail = localStorage.getItem('currentUser');

// Load user data
function loadUserData() {
    const allUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
    return allUserData[currentUserEmail] || { name: 'Guest', transactions: [], spendingLimit: 0, budgetGoals: {} };
}

// Save user data
function saveUserData(userData) {
    const allUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
    allUserData[currentUserEmail] = userData;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
}

// Load current user's data
let currentUserData = loadUserData();
let transactions = currentUserData.transactions;
let spendingLimit = currentUserData.spendingLimit;
let budgetGoals = currentUserData.budgetGoals;

// Signup functionality
function signup(fullName, email, password) {
    const allUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
    if (allUserData[email]) {
        throw new Error('User already exists');
    }
    allUserData[email] = {
        name: fullName,
        transactions: [],
        spendingLimit: 0,
        budgetGoals: {}
    };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
}

// Login functionality
function login(email, password) {
    const allUserData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
    if (!allUserData[email]) {
        throw new Error('User not found');
    }
    // In a real app, you would check the password here
    localStorage.setItem('currentUser', email);
    currentUserEmail = email;
    currentUserData = loadUserData();
    transactions = currentUserData.transactions;
    spendingLimit = currentUserData.spendingLimit;
    budgetGoals = currentUserData.budgetGoals;
    window.location.href = 'index.html';
}

// Update dashboard
function updateDashboard() {
    if (!document.getElementById('totalBalance')) return; // Exit if not on dashboard page

    const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

    document.getElementById('totalBalance').textContent = `$${totalBalance.toFixed(2)}`;
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;

    updateIncomeVsExpensesChart(totalIncome, totalExpenses);
    updateExpenseCategoriesChart();
    updateRecentTransactions();
    updateSpendingLimitDisplay();
    updateBudgetGoals();
}

// Update Income vs Expenses chart
function updateIncomeVsExpensesChart(income, expenses) {
    const ctx = document.getElementById('incomeVsExpensesChart');
    if (!ctx) return; // Exit if chart element doesn't exist

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['#4CAF50', '#F44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update Expense Categories chart
function updateExpenseCategoriesChart() {
    const ctx = document.getElementById('expenseCategoriesChart');
    if (!ctx) return; // Exit if chart element doesn't exist

    const expenseCategories = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + Math.abs(t.amount);
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
                backgroundColor: ['#FF9800', '#2196F3', '#9C27B0', '#00BCD4', '#795548']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update recent transactions table
function updateRecentTransactions() {
    const tableBody = document.getElementById('recentTransactions');
    if (!tableBody) return; // Exit if table doesn't exist

    tableBody.innerHTML = '';
    transactions.slice(-5).reverse().forEach(t => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = t.date;
        row.insertCell(1).textContent = t.description;
        row.insertCell(2).textContent = t.category;
        row.insertCell(3).textContent = `$${Math.abs(t.amount).toFixed(2)}`;
        row.cells[3].style.color = t.amount > 0 ? 'green' : 'red';
    });
}

// Update spending limit display
function updateSpendingLimitDisplay() {
    const limitElement = document.getElementById('currentLimit');
    const progressElement = document.getElementById('limitProgress');
    if (!limitElement || !progressElement) return; // Exit if elements don't exist

    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const limitPercentage = spendingLimit > 0 ? (totalExpenses / spendingLimit) * 100 : 0;

    limitElement.textContent = `Current Limit: $${spendingLimit}`;
    progressElement.style.width = `${limitPercentage}%`;
    progressElement.textContent = `${limitPercentage.toFixed(2)}%`;
    progressElement.setAttribute('aria-valuenow', limitPercentage);

    // Update notification
    const notificationArea = document.getElementById('notificationArea');
    if (notificationArea) {
        if (limitPercentage >= 90) {
            notificationArea.className = 'alert alert-danger';
            notificationArea.textContent = 'Warning: You have reached 90% of your spending limit!';
        } else if (limitPercentage >= 75) {
            notificationArea.className = 'alert alert-warning';
            notificationArea.textContent = 'Caution: You have reached 75% of your spending limit.';
        } else {
            notificationArea.className = 'alert alert-info';
            notificationArea.textContent = 'You are within your spending limit.';
        }
    }
}

// Update budget goals
function updateBudgetGoals() {
    const budgetGoalsElement = document.getElementById('budgetGoals');
    if (!budgetGoalsElement) return; // Exit if element doesn't exist

    budgetGoalsElement.innerHTML = '';
    for (const [category, goal] of Object.entries(budgetGoals)) {
        const spent = Math.abs(transactions.filter(t => t.category === category && t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
        const percentage = (spent / goal) * 100;

        const goalElement = document.createElement('div');
        goalElement.className = 'mb-3';
        goalElement.innerHTML = `
            <h6>${category}</h6>
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage.toFixed(2)}%</div>
            </div>
            <small>$${spent.toFixed(2)} / $${goal.toFixed(2)}</small>
        `;
        budgetGoalsElement.appendChild(goalElement);
    }
}

// Add new transaction
function addTransaction(transaction) {
    transactions.push(transaction);
    currentUserData.transactions = transactions;
    saveUserData(currentUserData);
    updateDashboard();
}

// Set spending limit
function setSpendingLimit(limit) {
    spendingLimit = limit;
    currentUserData.spendingLimit = spendingLimit;
    saveUserData(currentUserData);
    updateDashboard();
}

// Set budget goal
function setBudgetGoal(category, amount) {
    budgetGoals[category] = amount;
    currentUserData.budgetGoals = budgetGoals;
    saveUserData(currentUserData);
    updateDashboard();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                signup(fullName, email, password);
                alert('Signup successful! Please log in.');
                window.location.href = 'login.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                login(email, password);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Dashboard initialization
    if (document.getElementById('totalBalance')) {
        if (!currentUserEmail) {
            alert('Please log in to view your dashboard.');
            window.location.href = 'login.html';
        } else {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUserData.name}!`;
            updateDashboard();
        }
    }

    // Add transaction form
    const addTransactionForm = document.getElementById('addTransactionForm');
    if (addTransactionForm) {
        addTransactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newTransaction = {
                date: document.getElementById('transactionDate').value,
                description: document.getElementById('transactionDescription').value,
                category: document.getElementById('transactionCategory').value,
                amount: parseFloat(document.getElementById('transactionAmount').value) * (document.getElementById('transactionType').value === 'expense' ? -1 : 1)
            };
            addTransaction(newTransaction);
            this.reset();
        });
    }

    // Set spending limit
    const setLimitBtn = document.getElementById('setLimitBtn');
    if (setLimitBtn) {
        setLimitBtn.addEventListener('click', function() {
            const limitInput = document.getElementById('spendingLimitInput');
            const newLimit = parseFloat(limitInput.value);
            if (!isNaN(newLimit) && newLimit > 0) {
                setSpendingLimit(newLimit);
                limitInput.value = '';
            } else {
                alert('Please enter a valid spending limit.');
            }
        });
    }

    // Set budget goal
    const setBudgetGoalForm = document.getElementById('setBudgetGoalForm');
    if (setBudgetGoalForm) {
        setBudgetGoalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const category = document.getElementById('budgetCategory').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);
            if (!isNaN(amount) && amount > 0) {
                setBudgetGoal(category, amount);
                this.reset();
            } else {
                alert('Please enter a valid budget amount.');
            }
        });
    }

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
});