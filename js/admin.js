/**
 * PONLEU - Admin Application
 * Version: 2.0.0
 */

// =====================================================
// Application State
// =====================================================

const AdminState = {
    currentPage: 'dashboard',
    isLoading: false
};

// =====================================================
// DOM Elements Cache
// =====================================================

const AdminDOM = {
    mainContent: null,
    loadingOverlay: null,
    toast: null
};

// =====================================================
// Utility Functions
// =====================================================

function showLoading(show = true) {
    AdminState.isLoading = show;
    if (AdminDOM.loadingOverlay) {
        if (show) {
            AdminDOM.loadingOverlay.classList.add('active');
        } else {
            AdminDOM.loadingOverlay.classList.remove('active');
        }
    }
}

function showToast(message, type = 'success') {
    if (!AdminDOM.toast) return;
    
    const icon = AdminDOM.toast.querySelector('#toastIcon');
    const messageSpan = AdminDOM.toast.querySelector('#toastMessage');
    
    if (icon) {
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    }
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    AdminDOM.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        AdminDOM.toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// =====================================================
// Modal Management
// =====================================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showLoginModal() {
    showModal('loginModal');
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.style.display = 'none';
}

// =====================================================
// Authentication Handlers
// =====================================================

async function handleLogin() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    
    if (!username || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter username/email and password';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    showLoading(true);
    const result = await PonleuAPI.login(username, password);
    showLoading(false);
    
    if (result.success && result.user.role === 'admin') {
        closeModal('loginModal');
        updateAuthUI();
        showToast('Welcome Admin!');
        navigate('dashboard');
    } else {
        if (errorDiv) {
            errorDiv.textContent = 'Access denied. Admin only.';
            errorDiv.style.display = 'block';
        }
    }
}

function handleLogout() {
    PonleuAPI.logout();
    updateAuthUI();
    showToast('Logged out successfully');
    navigate('dashboard');
}

function updateAuthUI() {
    const currentUser = PonleuAPI.getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (currentUser && currentUser.role === 'admin') {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        
        const initial = currentUser.avatar || currentUser.username.charAt(0).toUpperCase();
        const userAvatarImg = document.getElementById('userAvatarImg');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        
        if (userAvatarImg) userAvatarImg.textContent = initial;
        if (dropdownAvatar) dropdownAvatar.textContent = initial;
        if (dropdownName) dropdownName.textContent = currentUser.username;
        if (dropdownEmail) dropdownEmail.textContent = currentUser.email;
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// =====================================================
// Navigation
// =====================================================

async function navigate(page, params = {}) {
    AdminState.currentPage = page;
    
    // Close mobile menu
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showLoading(true);
    
    switch (page) {
        case 'dashboard':
            await renderDashboard();
            break;
        case 'users':
            await renderUsers();
            break;
        case 'posts':
            await renderPosts();
            break;
        case 'categories':
            await renderCategories();
            break;
        case 'comments':
            await renderComments();
            break;
        default:
            await renderDashboard();
    }
    
    showLoading(false);
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// =====================================================
// Chart Functions
// =====================================================

function getMonthlyData(posts) {
    const months = {};
    posts.forEach(post => {
        const month = new Date(post.created_at).toLocaleString('default', { month: 'short' });
        months[month] = (months[month] || 0) + 1;
    });
    return {
        labels: Object.keys(months),
        data: Object.values(months)
    };
}

async function getCategoryStats() {
    const categories = await PonleuAPI.getAllCategories();
    const posts = await PonleuAPI.getAllPosts();
    
    const stats = categories.map(cat => ({
        name: cat.name,
        count: posts.filter(p => p.category_id === cat.id).length
    }));
    
    return {
        labels: stats.map(s => s.name),
        data: stats.map(s => s.count)
    };
}

function initMonthlyChart(data) {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;
    
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Posts',
                data: data.data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: 'white',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function initCategoryChart(data) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// =====================================================
// Render Functions
// =====================================================

async function renderDashboard() {
    const currentUser = PonleuAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showLoginModal();
        return;
    }
    
    const stats = await PonleuAPI.getSiteStats();
    const posts = await PonleuAPI.getAllPosts();
    const users = await PonleuAPI.getAllUsers();
    
    const monthlyData = getMonthlyData(posts);
    const categoryData = await getCategoryStats();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="dashboard-layout">
                    <aside class="dashboard-sidebar">
                        <h3><i class="fas fa-tachometer-alt"></i> Admin Panel</h3>
                        <ul class="dashboard-menu">
                            <li><a class="active" onclick="PonleuAdmin.navigate('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                            <li><a onclick="PonleuAdmin.navigate('users')"><i class="fas fa-users"></i> Users</a></li>
                            <li><a onclick="PonleuAdmin.navigate('posts')"><i class="fas fa-file-alt"></i> Posts</a></li>
                            <li><a onclick="PonleuAdmin.navigate('categories')"><i class="fas fa-th-large"></i> Categories</a></li>
                            <li><a onclick="PonleuAdmin.navigate('comments')"><i class="fas fa-comments"></i> Comments</a></li>
                        </ul>
                    </aside>
                    
                    <div class="dashboard-main">
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-box-info">
                                    <h3>${stats.total_posts}</h3>
                                    <p>Total Posts</p>
                                </div>
                                <div class="stat-box-icon"><i class="fas fa-file-alt"></i></div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-info">
                                    <h3>${stats.total_users}</h3>
                                    <p>Total Users</p>
                                </div>
                                <div class="stat-box-icon"><i class="fas fa-users"></i></div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-info">
                                    <h3>${stats.total_views.toLocaleString()}</h3>
                                    <p>Total Views</p>
                                </div>
                                <div class="stat-box-icon"><i class="fas fa-eye"></i></div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-info">
                                    <h3>${stats.total_likes.toLocaleString()}</h3>
                                    <p>Total Likes</p>
                                </div>
                                <div class="stat-box-icon"><i class="fas fa-heart"></i></div>
                            </div>
                        </div>
                        
                        <div class="charts-grid">
                            <div class="chart-card">
                                <h3><i class="fas fa-chart-line"></i> Monthly Posts</h3>
                                <canvas id="monthlyChart"></canvas>
                            </div>
                            <div class="chart-card">
                                <h3><i class="fas fa-chart-pie"></i> Posts by Category</h3>
                                <canvas id="categoryChart"></canvas>
                            </div>
                        </div>
                        
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Author</th>
                                        <th>Status</th>
                                        <th>Likes</th>
                                        <th>Views</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${posts.slice(0, 10).map(post => `
                                        <tr>
                                            <td>${post.id}</td>
                                            <td>${escapeHtml(post.title.substring(0, 40))}...</td>
                                            <td>${escapeHtml(users.find(u => u.id === post.user_id)?.username || 'Unknown')}</td>
                                            <td><span class="status-badge ${post.status === 'published' ? 'status-active' : 'status-draft'}">${post.status}</span></td>
                                            <td>${post.likes || 0}</td>
                                            <td>${post.views || 0}</td>
                                            <td>${formatDate(post.created_at)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (AdminDOM.mainContent) AdminDOM.mainContent.innerHTML = html;
    
    setTimeout(() => {
        initMonthlyChart(monthlyData);
        initCategoryChart(categoryData);
    }, 100);
}

async function renderUsers() {
    const users = await PonleuAPI.getAllUsers();
    const currentUser = PonleuAPI.getCurrentUser();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="dashboard-layout">
                    <aside class="dashboard-sidebar">
                        <h3><i class="fas fa-tachometer-alt"></i> Admin Panel</h3>
                        <ul class="dashboard-menu">
                            <li><a onclick="PonleuAdmin.navigate('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                            <li><a class="active" onclick="PonleuAdmin.navigate('users')"><i class="fas fa-users"></i> Users</a></li>
                            <li><a onclick="PonleuAdmin.navigate('posts')"><i class="fas fa-file-alt"></i> Posts</a></li>
                            <li><a onclick="PonleuAdmin.navigate('categories')"><i class="fas fa-th-large"></i> Categories</a></li>
                            <li><a onclick="PonleuAdmin.navigate('comments')"><i class="fas fa-comments"></i> Comments</a></li>
                        </ul>
                    </aside>
                    
                    <div class="dashboard-main">
                        <div class="section-header">
                            <h2><i class="fas fa-users"></i> Manage Users</h2>
                        </div>
                        
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Avatar</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${users.map(user => `
                                        <tr>
                                            <td>${user.id}</td>
                                            <td><div class="user-avatar" style="width: 35px; height: 35px; font-size: 0.8rem;">${user.avatar || user.username.charAt(0).toUpperCase()}</div></td>
                                            <td><strong>${escapeHtml(user.username)}</strong></td>
                                            <td>${escapeHtml(user.email)}</td>
                                            <td>
                                                <select class="role-select" onchange="PonleuAdmin.updateUserRole(${user.id}, this.value)" ${user.id === currentUser?.id ? 'disabled' : ''}>
                                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                                    <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
                                                    <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}" onclick="PonleuAdmin.toggleUserStatus(${user.id})">
                                                    ${user.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td>${formatDate(user.created_at)}</td>
                                            <td class="action-buttons">
                                                ${user.id !== currentUser?.id ? `<button class="btn-icon btn-delete" onclick="PonleuAdmin.deleteUser(${user.id})"><i class="fas fa-trash"></i> Delete</button>` : '<span style="color: gray;">Yourself</span>'}
                                            </td>
                                        </table>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (AdminDOM.mainContent) AdminDOM.mainContent.innerHTML = html;
}

async function renderPosts() {
    const posts = await PonleuAPI.getAllPosts();
    const users = await PonleuAPI.getAllUsers();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="dashboard-layout">
                    <aside class="dashboard-sidebar">
                        <h3><i class="fas fa-tachometer-alt"></i> Admin Panel</h3>
                        <ul class="dashboard-menu">
                            <li><a onclick="PonleuAdmin.navigate('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                            <li><a onclick="PonleuAdmin.navigate('users')"><i class="fas fa-users"></i> Users</a></li>
                            <li><a class="active" onclick="PonleuAdmin.navigate('posts')"><i class="fas fa-file-alt"></i> Posts</a></li>
                            <li><a onclick="PonleuAdmin.navigate('categories')"><i class="fas fa-th-large"></i> Categories</a></li>
                            <li><a onclick="PonleuAdmin.navigate('comments')"><i class="fas fa-comments"></i> Comments</a></li>
                        </ul>
                    </aside>
                    
                    <div class="dashboard-main">
                        <div class="section-header">
                            <h2><i class="fas fa-file-alt"></i> Manage Posts</h2>
                        </div>
                        
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Author</th>
                                        <th>Status</th>
                                        <th>Likes</th>
                                        <th>Views</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${posts.map(post => `
                                        <tr>
                                            <td>${post.id}</td>
                                            <td>${escapeHtml(post.title.substring(0, 50))}${post.title.length > 50 ? '...' : ''}</td>
                                            <td>${escapeHtml(users.find(u => u.id === post.user_id)?.username || 'Unknown')}</td>
                                            <td><span class="status-badge ${post.status === 'published' ? 'status-active' : 'status-draft'}">${post.status}</span></td>
                                            <td>${post.likes || 0}</td>
                                            <td>${post.views || 0}</td>
                                            <td>${formatDate(post.created_at)}</td>
                                            <td class="action-buttons">
                                                <button class="btn-icon btn-delete" onclick="PonleuAdmin.deletePost(${post.id})"><i class="fas fa-trash"></i> Delete</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (AdminDOM.mainContent) AdminDOM.mainContent.innerHTML = html;
}

async function renderCategories() {
    const categories = await PonleuAPI.getAllCategories();
    const posts = await PonleuAPI.getAllPosts();
    
    const categoriesWithCount = categories.map(cat => ({
        ...cat,
        post_count: posts.filter(p => p.category_id === cat.id).length
    }));
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="dashboard-layout">
                    <aside class="dashboard-sidebar">
                        <h3><i class="fas fa-tachometer-alt"></i> Admin Panel</h3>
                        <ul class="dashboard-menu">
                            <li><a onclick="PonleuAdmin.navigate('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                            <li><a onclick="PonleuAdmin.navigate('users')"><i class="fas fa-users"></i> Users</a></li>
                            <li><a onclick="PonleuAdmin.navigate('posts')"><i class="fas fa-file-alt"></i> Posts</a></li>
                            <li><a class="active" onclick="PonleuAdmin.navigate('categories')"><i class="fas fa-th-large"></i> Categories</a></li>
                            <li><a onclick="PonleuAdmin.navigate('comments')"><i class="fas fa-comments"></i> Comments</a></li>
                        </ul>
                    </aside>
                    
                    <div class="dashboard-main">
                        <div class="section-header">
                            <h2><i class="fas fa-th-large"></i> Manage Categories</h2>
                            <button class="btn-primary" onclick="PonleuAdmin.showAddCategoryModal()"><i class="fas fa-plus"></i> Add Category</button>
                        </div>
                        
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Icon</th>
                                        <th>Name</th>
                                        <th>Slug</th>
                                        <th>Posts</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${categoriesWithCount.map(cat => `
                                        <tr>
                                            <td>${cat.id}</td>
                                            <td><i class="fas ${cat.icon}" style="font-size: 1.2rem;"></i></td>
                                            <td><strong>${escapeHtml(cat.name)}</strong></td>
                                            <td><code>${cat.slug}</code></td>
                                            <td>${cat.post_count}</td>
                                            <td><span class="status-badge ${cat.is_active ? 'status-active' : 'status-inactive'}">${cat.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td class="action-buttons">
                                                <button class="btn-icon btn-delete" onclick="PonleuAdmin.deleteCategory(${cat.id})"><i class="fas fa-trash"></i> Delete</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (AdminDOM.mainContent) AdminDOM.mainContent.innerHTML = html;
}

async function renderComments() {
    const comments = await PonleuAPI.getFallbackData('comments');
    const users = await PonleuAPI.getAllUsers();
    const posts = await PonleuAPI.getAllPosts();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="dashboard-layout">
                    <aside class="dashboard-sidebar">
                        <h3><i class="fas fa-tachometer-alt"></i> Admin Panel</h3>
                        <ul class="dashboard-menu">
                            <li><a onclick="PonleuAdmin.navigate('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                            <li><a onclick="PonleuAdmin.navigate('users')"><i class="fas fa-users"></i> Users</a></li>
                            <li><a onclick="PonleuAdmin.navigate('posts')"><i class="fas fa-file-alt"></i> Posts</a></li>
                            <li><a onclick="PonleuAdmin.navigate('categories')"><i class="fas fa-th-large"></i> Categories</a></li>
                            <li><a class="active" onclick="PonleuAdmin.navigate('comments')"><i class="fas fa-comments"></i> Comments</a></li>
                        </ul>
                    </aside>
                    
                    <div class="dashboard-main">
                        <div class="section-header">
                            <h2><i class="fas fa-comments"></i> Manage Comments</h2>
                        </div>
                        
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Author</th>
                                        <th>Comment</th>
                                        <th>On Post</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${comments.map(comment => {
                                        const author = users.find(u => u.id === comment.user_id);
                                        const post = posts.find(p => p.id === comment.post_id);
                                        return `
                                            <tr>
                                                <td>${comment.id}</td>
                                                <td><strong>${escapeHtml(author?.username || 'Unknown')}</strong></td>
                                                <td>${escapeHtml(comment.comment.substring(0, 60))}...</td>
                                                <td>${escapeHtml(post?.title.substring(0, 30) || 'Unknown')}...</td>
                                                <td>${formatDate(comment.created_at)}</td>
                                                <td class="action-buttons">
                                                    <button class="btn-icon btn-delete" onclick="PonleuAdmin.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Delete</button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (AdminDOM.mainContent) AdminDOM.mainContent.innerHTML = html;
}

// =====================================================
// Admin Action Handlers
// =====================================================

async function updateUserRole(userId, role) {
    await PonleuAPI.updateUserRole(userId, role);
    showToast('User role updated successfully');
    await renderUsers();
}

async function toggleUserStatus(userId) {
    await PonleuAPI.toggleUserStatus(userId);
    showToast('User status toggled successfully');
    await renderUsers();
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const result = await PonleuAPI.deleteUser(userId);
        if (result.success) {
            showToast('User deleted successfully');
            await renderUsers();
        } else {
            showToast(result.message, 'error');
        }
    }
}

async function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        await PonleuAPI.deletePost(postId);
        showToast('Post deleted successfully');
        await renderPosts();
    }
}

async function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        await PonleuAPI.deleteCategory(categoryId);
        showToast('Category deleted successfully');
        await renderCategories();
    }
}

async function deleteComment(commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        await PonleuAPI.deleteComment(commentId);
        showToast('Comment deleted successfully');
        await renderComments();
    }
}

function showAddCategoryModal() {
    const name = prompt('Enter category name:');
    const icon = prompt('Enter icon class (e.g., fa-palette):');
    const slug = name?.toLowerCase().replace(/ /g, '-');
    
    if (name && icon) {
        PonleuAPI.createCategory({
            name: name,
            slug: slug,
            icon: icon,
            description: '',
            is_active: true
        });
        showToast('Category added successfully');
        renderCategories();
    }
}

// =====================================================
// Mobile Menu & Scroll to Top
// =====================================================

function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
}

function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// =====================================================
// Initialize Application
// =====================================================

function init() {
    // Cache DOM elements
    AdminDOM.mainContent = document.getElementById('mainContent');
    AdminDOM.loadingOverlay = document.getElementById('loadingOverlay');
    AdminDOM.toast = document.getElementById('toast');
    
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }
    
    // Initialize UI
    updateAuthUI();
    initMobileMenu();
    initScrollToTop();
    
    // Set global functions
    window.PonleuAdmin = {
        navigate,
        showLoginModal,
        closeModal,
        login: handleLogin,
        logout: handleLogout,
        updateUserRole,
        toggleUserStatus,
        deleteUser,
        deletePost,
        deleteCategory,
        deleteComment,
        showAddCategoryModal
    };
    
    // Check if already logged in as admin
    const currentUser = PonleuAPI.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        navigate('dashboard');
    } else {
        showLoginModal();
    }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);