/**
 * PONLEU - User Application
 * Version: 2.0.0
 */

// =====================================================
// Application State
// =====================================================

const UserState = {
    currentPage: 'home',
    currentPostId: null,
    isLoading: false
};

// =====================================================
// DOM Elements Cache
// =====================================================

const UserDOM = {
    mainContent: null,
    loadingOverlay: null,
    toast: null
};

// =====================================================
// Utility Functions
// =====================================================

function showLoading(show = true) {
    UserState.isLoading = show;
    if (UserDOM.loadingOverlay) {
        if (show) {
            UserDOM.loadingOverlay.classList.add('active');
        } else {
            UserDOM.loadingOverlay.classList.remove('active');
        }
    }
}

function showToast(message, type = 'success') {
    if (!UserDOM.toast) return;
    
    const icon = UserDOM.toast.querySelector('#toastIcon');
    const messageSpan = UserDOM.toast.querySelector('#toastMessage');
    
    if (icon) {
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    }
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    UserDOM.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        UserDOM.toast.classList.remove('show');
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

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
    return `${Math.floor(diff / 31536000)} years ago`;
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

function showRegisterModal() {
    showModal('registerModal');
    const errorDiv = document.getElementById('regError');
    if (errorDiv) errorDiv.style.display = 'none';
}

function openSearch() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('searchInput')?.focus();
    }
}

function closeSearch() {
    const modal = document.getElementById('searchModal');
    if (modal) modal.classList.remove('active');
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
    
    if (result.success) {
        closeModal('loginModal');
        updateAuthUI();
        showToast('Login successful! Welcome back!');
        navigate('home');
    } else {
        if (errorDiv) {
            errorDiv.textContent = result.message;
            errorDiv.style.display = 'block';
        }
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirm = document.getElementById('regConfirm')?.value;
    const errorDiv = document.getElementById('regError');
    
    if (!username || !email || !password || !confirm) {
        if (errorDiv) {
            errorDiv.textContent = 'Please fill in all fields';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    showLoading(true);
    const result = await PonleuAPI.register({ username, email, password, confirmPassword: confirm });
    showLoading(false);
    
    if (result.success) {
        closeModal('registerModal');
        updateAuthUI();
        showToast('Registration successful! Welcome to PONLEU!');
        navigate('home');
    } else {
        if (errorDiv) {
            errorDiv.textContent = result.message;
            errorDiv.style.display = 'block';
        }
    }
}

function handleLogout() {
    PonleuAPI.logout();
    updateAuthUI();
    showToast('Logged out successfully');
    navigate('home');
}

function updateAuthUI() {
    const currentUser = PonleuAPI.getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (currentUser) {
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
    UserState.currentPage = page;
    
    // Close mobile menu
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showLoading(true);
    
    switch (page) {
        case 'home':
            await renderHome();
            break;
        case 'explore':
            await renderExplore();
            break;
        case 'categories':
            await renderCategories();
            break;
        case 'about':
            renderAbout();
            break;
        case 'profile':
            await renderProfile();
            break;
        case 'my-posts':
            await renderMyPosts();
            break;
        case 'create-post':
            await renderCreatePost();
            break;
        default:
            await renderHome();
    }
    
    showLoading(false);
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// =====================================================
// Render Functions
// =====================================================

async function renderHome() {
    const [posts, stats, categories] = await Promise.all([
        PonleuAPI.getAllPosts(),
        PonleuAPI.getSiteStats(),
        PonleuAPI.getAllCategories()
    ]);
    
    const featuredPosts = posts.filter(p => p.is_featured && p.status === 'published').slice(0, 3);
    const latestPosts = posts.filter(p => p.status === 'published').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
    const currentUser = PonleuAPI.getCurrentUser();
    
    const html = `
        <section class="hero" data-aos="fade-up">
            <div class="hero-content">
                <div class="hero-badge">
                    <i class="fas fa-code"></i> Cambodia Creative Platform
                </div>
                <h1>PONLEU <span class="gradient-text">Share Your Work</span></h1>
                <p>Empowering Cambodian designers and developers to showcase their work, connect with community, and grow their careers.</p>
                <div class="hero-buttons">
                    ${currentUser ? 
                        `<button class="btn-primary" onclick="navigate('create-post')"><i class="fas fa-upload"></i> Upload Work</button>` :
                        `<button class="btn-primary" onclick="showRegisterModal()"><i class="fas fa-user-plus"></i> Get Started</button>`
                    }
                    <button class="btn-outline" onclick="document.getElementById('exploreSection').scrollIntoView({behavior: 'smooth'})">
                        <i class="fas fa-search"></i> Explore Works
                    </button>
                </div>
                <div class="hero-stats">
                    <div class="stat-card"><div class="stat-number">${stats.total_posts}</div><div class="stat-label">Works</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.total_users}</div><div class="stat-label">Creators</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.total_views.toLocaleString()}</div><div class="stat-label">Views</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.total_likes.toLocaleString()}</div><div class="stat-label">Likes</div></div>
                </div>
            </div>
        </section>
        
        ${featuredPosts.length > 0 ? `
        <section class="section" data-aos="fade-up">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-crown"></i> Featured Works</h2>
                    <a class="view-all" onclick="navigate('explore')">View All <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="featured-grid">
                    ${featuredPosts.map((post, index) => renderPostCard(post, index + 1, true)).join('')}
                </div>
            </div>
        </section>
        ` : ''}
        
        <section class="section" id="exploreSection" data-aos="fade-up">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-star"></i> Latest Works</h2>
                    <button class="search-btn" onclick="openSearch()"><i class="fas fa-search"></i> Search</button>
                </div>
                <div class="posts-grid">
                    ${latestPosts.map(post => renderPostCard(post)).join('')}
                </div>
                ${latestPosts.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No works found</p>
                        ${currentUser ? '<button class="btn-primary" onclick="navigate(\'create-post\')">Create First Post</button>' : ''}
                    </div>
                ` : ''}
            </div>
        </section>
        
        <section class="section" data-aos="fade-up">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-th-large"></i> Categories</h2>
                    <a class="view-all" onclick="navigate('categories')">All Categories <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="categories-grid">
                    ${categories.slice(0, 5).map(cat => `
                        <div class="category-card" onclick="navigate('categories')">
                            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
                            <div class="category-name">${escapeHtml(cat.name)}</div>
                            <div class="category-count">0 works</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        
        <section class="section" data-aos="fade-up">
            <div class="container">
                <div class="form-card" style="text-align: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none;">
                    <h3><i class="fas fa-rocket"></i> Ready to Showcase Your Work?</h3>
                    <p style="margin: 1rem 0;">Join our community of creators and start sharing your portfolio today!</p>
                    ${!currentUser ? 
                        `<button class="btn-primary" onclick="showRegisterModal()" style="background: white; color: #6366f1;">Sign Up Now</button>` :
                        `<button class="btn-primary" onclick="navigate('create-post')" style="background: white; color: #6366f1;">Create New Post</button>`
                    }
                </div>
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

async function renderExplore() {
    const posts = await PonleuAPI.getAllPosts();
    const publishedPosts = posts.filter(p => p.status === 'published').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-compass"></i> Explore All Works</h2>
                    <button class="btn-outline" onclick="navigate('home')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <div class="posts-grid">
                    ${publishedPosts.map(post => renderPostCard(post)).join('')}
                </div>
                ${publishedPosts.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No works found</p>
                    </div>
                ` : ''}
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

async function renderCategories() {
    const categories = await PonleuAPI.getAllCategories();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-th-large"></i> All Categories</h2>
                    <button class="btn-outline" onclick="navigate('home')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <div class="categories-grid">
                    ${categories.map(cat => `
                        <div class="category-card" onclick="navigate('explore')">
                            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
                            <div class="category-name">${escapeHtml(cat.name)}</div>
                            <div class="category-count">0 works</div>
                            <p style="font-size: 0.75rem; color: var(--gray); margin-top: 0.5rem;">${escapeHtml(cat.description?.substring(0, 60))}...</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

async function renderProfile() {
    const currentUser = PonleuAPI.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const posts = await PonleuAPI.getAllPosts();
    const myPosts = posts.filter(p => p.user_id === currentUser.id);
    const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="form-card">
                    <div style="text-align: center;">
                        <div class="user-avatar" style="width: 100px; height: 100px; font-size: 2.5rem; margin: 0 auto 1rem;">${currentUser.avatar || currentUser.username.charAt(0).toUpperCase()}</div>
                        <h2>${escapeHtml(currentUser.username)}</h2>
                        <span class="role-badge role-${currentUser.role}" style="margin: 0.5rem 0; display: inline-block;">${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>
                        <div style="margin: 1rem 0;">
                            <p><i class="fas fa-envelope"></i> ${escapeHtml(currentUser.email)}</p>
                            <p><i class="fas fa-calendar"></i> Joined ${formatDate(currentUser.created_at)}</p>
                            ${currentUser.bio ? `<p><i class="fas fa-info-circle"></i> ${escapeHtml(currentUser.bio)}</p>` : ''}
                        </div>
                        <div class="post-meta" style="justify-content: center; gap: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                            <span><i class="fas fa-file-alt"></i> ${myPosts.length} Works</span>
                            <span><i class="fas fa-heart" style="color: #ef4444;"></i> ${totalLikes} Likes</span>
                        </div>
                        <div style="margin-top: 1.5rem;">
                            <button class="btn-primary" onclick="navigate('my-posts')"><i class="fas fa-file-alt"></i> My Works</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

async function renderMyPosts() {
    const currentUser = PonleuAPI.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const posts = await PonleuAPI.getAllPosts();
    const myPosts = posts.filter(p => p.user_id === currentUser.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-file-alt"></i> My Works</h2>
                    <button class="btn-primary" onclick="navigate('create-post')"><i class="fas fa-plus"></i> Create New</button>
                </div>
                <div class="posts-grid">
                    ${myPosts.map(post => renderPostCard(post)).join('')}
                </div>
                ${myPosts.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>You haven't created any works yet</p>
                        <button class="btn-primary" onclick="navigate('create-post')">Create Your First Work</button>
                    </div>
                ` : ''}
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

async function renderCreatePost() {
    const currentUser = PonleuAPI.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const categories = await PonleuAPI.getAllCategories();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="form-card">
                    <div class="form-header">
                        <h2><i class="fas fa-plus-circle"></i> Create New Work</h2>
                        <p>Share your creative work with the community</p>
                    </div>
                    <form id="createPostForm" onsubmit="handleCreatePost(event)">
                        <div class="form-group">
                            <label><i class="fas fa-heading"></i> Title</label>
                            <input type="text" id="postTitle" placeholder="Enter your work title..." required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-folder"></i> Category</label>
                            <select id="postCategory" required>
                                ${categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-align-left"></i> Description</label>
                            <textarea id="postDescription" rows="8" placeholder="Describe your work in detail..." required></textarea>
                        </div>
                        <button type="submit" class="btn-primary btn-block">
                            <i class="fas fa-save"></i> Publish Work
                        </button>
                    </form>
                </div>
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

function renderAbout() {
    const html = `
        <section class="section">
            <div class="container">
                <div class="form-card">
                    <div style="text-align: center;">
                        <div class="logo-icon" style="width: 80px; height: 80px; font-size: 2.5rem; margin: 0 auto 1rem;">P</div>
                        <h1>About PONLEU</h1>
                        <p style="color: var(--gray); margin: 1rem 0;">Professional Platform for Designers & Programmers</p>
                    </div>
                    <hr style="margin: 2rem 0;">
                    <h3><i class="fas fa-bullseye"></i> Our Mission</h3>
                    <p>PONLEU is dedicated to empowering Cambodian creators by providing a platform to showcase their work, connect with like-minded professionals, and grow their careers in the digital economy.</p>
                    
                    <h3 style="margin-top: 1.5rem;"><i class="fas fa-star"></i> Features</h3>
                    <ul style="margin-left: 1.5rem; color: var(--gray);">
                        <li>📤 Showcase your creative work</li>
                        <li>❤️ Get feedback and likes from community</li>
                        <li>🔍 Discover work by category</li>
                        <li>💬 Engage through comments</li>
                        <li>📊 Track your work's performance</li>
                    </ul>
                    
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: var(--radius-lg); padding: 2rem; text-align: center; color: white; margin-top: 2rem;">
                        <h3>Ready to showcase your work?</h3>
                        <p style="margin: 0.5rem 0;">Join our community of creators today!</p>
                        ${!PonleuAPI.getCurrentUser() ? 
                            `<button class="btn-primary" onclick="showRegisterModal()" style="background: white; color: #6366f1; margin-top: 1rem;">Sign Up Now</button>` : ''
                        }
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
}

function renderPostCard(post, rank = null, isFeatured = false) {
    return `
        <div class="${isFeatured ? 'featured-card' : 'post-card'}" onclick="viewPostDetail(${post.id})">
            ${rank ? `<div class="featured-rank">#${rank}</div>` : ''}
            <div class="${isFeatured ? 'featured-image' : 'post-image'}">
                <div class="file-badge"><i class="fas fa-file-alt"></i> ${post.category_name || 'General'}</div>
            </div>
            <div class="${isFeatured ? 'featured-content' : 'post-content'}">
                <div class="post-meta">
                    <div class="post-author">
                        <div class="post-author-avatar">${post.username?.charAt(0).toUpperCase() || 'U'}</div>
                        <span>${escapeHtml(post.username || 'Unknown')}</span>
                    </div>
                    <span class="post-category">${post.category_name || 'General'}</span>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-description">${escapeHtml(post.description?.substring(0, 100))}...</p>
                <div class="post-stats">
                    <span><i class="fas fa-heart" style="color: #ef4444;"></i> ${post.likes || 0}</span>
                    <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
                    <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

async function viewPostDetail(postId) {
    const post = await PonleuAPI.getPostById(postId);
    if (!post) {
        showToast('Post not found', 'error');
        return;
    }
    
    const users = await PonleuAPI.getAllUsers();
    const author = users.find(u => u.id === post.user_id);
    
    const modalBody = document.getElementById('postModalBody');
    const modalTitle = document.getElementById('postModalTitle');
    
    modalTitle.textContent = post.title;
    modalBody.innerHTML = `
        <div class="post-meta" style="margin-bottom: 1rem;">
            <div class="post-author">
                <div class="post-author-avatar">${author?.username?.charAt(0).toUpperCase() || 'U'}</div>
                <span><strong>${escapeHtml(author?.username || 'Unknown')}</strong></span>
                <span class="role-badge role-${author?.role || 'viewer'}">${author?.role || 'Viewer'}</span>
            </div>
            <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
        </div>
        <div style="margin-bottom: 1.5rem;">
            <p style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(post.description)}</p>
        </div>
        <div class="post-stats" style="border-top: 1px solid var(--border); padding-top: 1rem;">
            <span><i class="fas fa-heart" style="color: #ef4444;"></i> ${post.likes} Likes</span>
            <span><i class="fas fa-eye"></i> ${post.views} Views</span>
        </div>
        ${PonleuAPI.getCurrentUser() && PonleuAPI.getCurrentUser().id !== post.user_id ? `
            <div style="margin-top: 1rem; text-align: center;">
                <button class="btn-primary" onclick="handleLike(${post.id})">
                    <i class="fas fa-heart"></i> Like this work
                </button>
            </div>
        ` : ''}
    `;
    
    showModal('postModal');
}

// =====================================================
// Action Handlers
// =====================================================

async function handleCreatePost(event) {
    event.preventDefault();
    
    const currentUser = PonleuAPI.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const title = document.getElementById('postTitle')?.value.trim();
    const categoryId = parseInt(document.getElementById('postCategory')?.value);
    const description = document.getElementById('postDescription')?.value.trim();
    
    if (!title || !description) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    const newPost = {
        user_id: currentUser.id,
        category_id: categoryId,
        title: title,
        slug: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
        description: description,
        status: 'published',
        is_featured: false
    };
    
    await PonleuAPI.createPost(newPost);
    showLoading(false);
    showToast('Work published successfully!');
    navigate('my-posts');
}

async function handleLike(postId) {
    const currentUser = PonleuAPI.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const result = await PonleuAPI.toggleLike(postId, currentUser.id);
    showToast(result.liked ? 'You liked this work!' : 'You removed your like');
    closeModal('postModal');
    await viewPostDetail(postId);
}

// =====================================================
// Search Handlers
// =====================================================

function handleSearch(event) {
    event.preventDefault();
    const keyword = document.getElementById('searchInput')?.value.trim();
    if (keyword) {
        closeSearch();
        performSearch(keyword);
    }
}

function quickSearch(keyword) {
    closeSearch();
    performSearch(keyword);
}

async function performSearch(keyword) {
    showLoading(true);
    const posts = await PonleuAPI.getAllPosts();
    const results = posts.filter(post => 
        post.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (post.description && post.description.toLowerCase().includes(keyword.toLowerCase()))
    );
    showLoading(false);
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-search"></i> Search Results for "${escapeHtml(keyword)}"</h2>
                    <button class="btn-outline" onclick="navigate('home')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <div class="posts-grid">
                    ${results.map(post => renderPostCard(post)).join('')}
                </div>
                ${results.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No results found for "${escapeHtml(keyword)}"</p>
                    </div>
                ` : ''}
            </div>
        </section>
    `;
    
    if (UserDOM.mainContent) UserDOM.mainContent.innerHTML = html;
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
    UserDOM.mainContent = document.getElementById('mainContent');
    UserDOM.loadingOverlay = document.getElementById('loadingOverlay');
    UserDOM.toast = document.getElementById('toast');
    
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
    window.PonleuUser = {
        navigate,
        showLoginModal,
        showRegisterModal,
        closeModal,
        openSearch,
        closeSearch,
        handleSearch,
        quickSearch,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        handleCreatePost,
        viewPostDetail,
        handleLike
    };
    
    // Load home page
    navigate('home');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);