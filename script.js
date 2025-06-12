
// TaskFlow PWA - Progressive Web App Task Manager
class TaskFlowApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        this.loadTasks();
        this.setupEventListeners();
        this.setupPWA();
        this.setupTheme();
        this.setupOfflineDetection();
        this.registerServiceWorker();
        this.renderTasks();
    }

    // Local Storage Management
    loadTasks() {
        const savedTasks = localStorage.getItem('taskflow-tasks');
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    }

    saveTasks() {
        localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Task form submission
        const taskForm = document.getElementById('taskForm');
        taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Install button
        const installBtn = document.getElementById('installBtn');
        installBtn.addEventListener('click', () => this.handleInstall());
    }

    // Task Management
    handleAddTask(e) {
        e.preventDefault();
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();

        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.tasks.unshift(newTask);
            this.saveTasks();
            this.renderTasks();
            taskInput.value = '';

            // Show success feedback
            this.showToast('Task added successfully!', 'success');
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as pending';
            this.showToast(message, 'success');
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.showToast('Task deleted', 'info');
    }

    // Filter Management
    handleFilterChange(e) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentFilter = e.target.dataset.filter;
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return this.tasks;
        }
    }

    // Render Tasks
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            
            // Add event listeners to task elements
            this.addTaskEventListeners();
        }
    }

    createTaskHTML(task) {
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskApp.toggleTask(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <span class="task-text">${this.escapeHTML(task.text)}</span>
                <button class="delete-btn" onclick="taskApp.deleteTask(${task.id})">Delete</button>
            </div>
        `;
    }

    addTaskEventListeners() {
        // Event delegation is handled in the HTML onclick attributes for simplicity
        // In a production app, you might want to use proper event delegation
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Theme Management
    setupTheme() {
        const savedTheme = localStorage.getItem('taskflow-theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('taskflow-theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // PWA Setup
    setupPWA() {
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Handle successful install
        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            this.showToast('App installed successfully!', 'success');
        });
    }

    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        installBtn.classList.remove('hidden');
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        installBtn.classList.add('hidden');
    }

    async handleInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }

    // Offline Detection
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.hideOfflineNotification();
            this.showToast('You\'re back online!', 'success');
        });

        window.addEventListener('offline', () => {
            this.showOfflineNotification();
        });

        // Check initial status
        if (!navigator.onLine) {
            this.showOfflineNotification();
        }
    }

    showOfflineNotification() {
        const notification = document.getElementById('offlineNotification');
        notification.classList.remove('hidden');
    }

    hideOfflineNotification() {
        const notification = document.getElementById('offlineNotification');
        notification.classList.add('hidden');
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showToast('New version available! Refresh to update.', 'info');
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            fontSize: '14px',
            fontWeight: '500'
        });

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Hide and remove toast
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Export/Import Tasks (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'taskflow-backup.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Tasks exported successfully!', 'success');
    }
}

// Service Worker Code (embedded for simplicity)
const SW_CACHE_NAME = 'taskflow-v1';
const SW_CODE = `
const CACHE_NAME = '${SW_CACHE_NAME}';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
`;

// Create and register service worker
if ('serviceWorker' in navigator) {
    const swBlob = new Blob([SW_CODE], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    
    // Store SW URL for later registration
    window.swUrl = swUrl;
}

// Initialize the app
const taskApp = new TaskFlowApp();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const taskInput = document.getElementById('taskInput');
        if (taskInput.value.trim()) {
            document.getElementById('taskForm').dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        const taskInput = document.getElementById('taskInput');
        taskInput.value = '';
        taskInput.blur();
    }
});

// PWA Manifest creation
const manifest = {
    name: "TaskFlow - Progressive Task Manager",
    short_name: "TaskFlow",
    description: "A beautiful progressive web app for managing your daily tasks",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#667eea",
    orientation: "portrait",
    icons: [
        {
            src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOSAxMkwxMSAxNEwxNSAxMCIgc3Ryb2tlPSIjNjY3ZWVhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjEgMTJDMjEgMTYuOTcwNiAxNi45NzA2IDIxIDEyIDIxQzcuMDI5NCAyMSAzIDE2Ljk3MDYgMyAxMkMzIDcuMDI5NCA3LjAyOTQgMyAxMiAzQzE2Ljk3MDYgMyAyMSA3LjAyOTQgMjEgMTJaIiBzdHJva2U9IiM2NjdlZWEiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K",
            sizes: "192x192",
            type: "image/svg+xml"
        },
        {
            src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOSAxMkwxMSAxNEwxNSAxMCIgc3Ryb2tlPSIjNjY3ZWVhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjEgMTJDMjEgMTYuOTcwNiAxNi45NzA2IDIxIDEyIDIxQzcuMDI5NCAyMSAzIDE2Ljk3MDYgMyAxMkMzIDcuMDI5NCA3LjAyOTQgMyAxMiAzQzE2Ljk3MDYgMyAyMSA3LjAyOTQgMjEgMTJaIiBzdHJva2U9IiM2NjdlZWEiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K",
            sizes: "512x512",
            type: "image/svg+xml"
        }
    ]
};

// Create manifest file
const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
const manifestUrl = URL.createObjectURL(manifestBlob);

// Update manifest link
document.querySelector('link[rel="manifest"]').href = manifestUrl;

console.log('TaskFlow PWA initialized successfully! ✨');