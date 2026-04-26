/**
 * PONLEU - Main Application Logic
 * Professional Frontend Application
 * Version: 2.0.0
 */

// =====================================================
// Application State
// =====================================================

const AppState = {
    currentPage: 'home',
    currentPostId: null,
    isLoading: false,
    searchResults: [],
    categories: [],
    stats: null
};

// =====================================================
// DOM Elements Cache
// =====================================================

const DOM = {
    mainContent: null,
    loadingOverlay: null,
    toast: null,
    userMenu: null,
    authButtons: null,
    navMenu: null,
    mobileToggle: null
};

// =====================================================
// Utility Functions
// =====================================================

function showLoading(show = true) {
    AppState.isLoading = show;
    if (DOM.loadingOverlay) {
        if (show) {
            DOM.loadingOverlay.classList.add('active');
        } else {
            DOM.loadingOverlay.classList.remove('active');
        }
    }
}

function showToast(message, type = 'success') {
    if (!DOM.toast) return;
    
    const icon = DOM.toast.querySelector('#toastIcon');
    const messageSpan = DOM.toast.querySelector('#toastMessage');
    
    if (icon) {
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    }
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    DOM.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        DOM.toast.classList.remove('show');
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
    document.getElementById('loginError')?.style.setProperty('display', 'none');
}

function showRegisterModal() {
    showModal('registerModal');
    document.getElementById('regError')?.style.setProperty('display', 'none');
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
    const result = await PonleuAPI.auth.login(username, password);
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
    const result = await PonleuAPI.auth.register({ username, email, password, confirmPassword: confirm });
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
    PonleuAPI.auth.logout();
    updateAuthUI();
    showToast('Logged out successfully');
    navigate('home');
}

function updateAuthUI() {
    const currentUser = PonleuAPI.auth.getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        
        const userAvatar = document.getElementById('userAvatarImg');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        
        const initial = currentUser.avatar || currentUser.username.charAt(0).toUpperCase();
        
        if (userAvatar) userAvatar.textContent = initial;
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
    AppState.currentPage = page;
    
    // Close mobile menu
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Render page
    showLoading(true);
    
    switch (page) {
        case 'home':
            await renderHome();
            break;
        case 'explore':
            await renderExplore();
            break;
        case 'post':
            await renderPostDetail(params.id);
            break;
        case 'categories':
            await renderCategories();
            break;
        case 'category':
            await renderCategoryPosts(params.slug);
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
            renderCreatePost();
            break;
        default:
            await renderHome();
    }
    
    showLoading(false);
    
    // Initialize AOS for new content
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// =====================================================
// Page Renderers
// =====================================================

async function renderHome() {
    const [featuredPosts, allPosts, stats, categories] = await Promise.all([
        PonleuAPI.posts.getFeatured(3),
        PonleuAPI.posts.getAll(),
        PonleuAPI.stats.getSiteStats(),
        PonleuAPI.categories.getAll()
    ]);
    
    const currentUser = PonleuAPI.auth.getCurrentUser();
    
    const html = `
        <section class="hero" data-aos="fade-up">
            <div class="hero-content">
                <div class="hero-badge">
                    <i class="fas fa-code"></i> Cambodia Creative Platform
                </div>
                <h1>PONLEU <span class="gradient-text">Share Your Work</span></h1>
                <p>Empowering Cambodian designers and developers to showcase their work, connect with community, and grow their careers.</p>
                <div class="hero-buttons">
                    ${PonleuAPI.auth.canCreatePost() ? 
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
                    ${allPosts.slice(0, 6).map(post => renderPostCard(post)).join('')}
                </div>
                ${allPosts.length > 6 ? `
                    <div style="text-align: center; margin-top: 2rem;">
                        <button class="btn-primary" onclick="navigate('explore')">Load More <i class="fas fa-arrow-down"></i></button>
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
                        <div class="category-card" onclick="navigate('category', {slug: '${cat.slug}'})">
                            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
                            <div class="category-name">${escapeHtml(cat.name)}</div>
                            <div class="category-count">${cat.post_count} works</div>
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
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

async function renderExplore() {
    const allPosts = await PonleuAPI.posts.getAll();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-compass"></i> Explore All Works</h2>
                    <button class="btn-outline" onclick="navigate('home')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <div class="posts-grid">
                    ${allPosts.map(post => renderPostCard(post)).join('')}
                </div>
                ${allPosts.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No works found</p>
                        <button class="btn-primary" onclick="navigate('create-post')">Create First Post</button>
                    </div>
                ` : ''}
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

async function renderPostDetail(postId) {
    const post = await PonleuAPI.posts.getById(postId);
    if (!post) {
        renderNotFound();
        return;
    }
    
    await PonleuAPI.posts.incrementViews(postId);
    
    const currentUser = PonleuAPI.auth.getCurrentUser();
    const isLiked = false; // Would check from API
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="post-detail">
                    <div class="post-header">
                        <span class="post-category"><i class="fas ${post.category?.icon || 'fa-folder'}"></i> ${post.category?.name || 'General'}</span>
                        <h1>${escapeHtml(post.title)}</h1>
                        <div class="post-author-info">
                            <div class="post-author-avatar-lg">${post.author?.avatar || post.author?.username?.charAt(0).toUpperCase() || 'U'}</div>
                            <div>
                                <div>${escapeHtml(post.author?.username || 'Unknown')} ${post.author?.role ? `<span class="role-badge role-${post.author.role}">${post.author.role}</span>` : ''}</div>
                                <div style="font-size: 0.8rem; opacity: 0.9;">
                                    <i class="far fa-calendar-alt"></i> ${formatDate(post.created_at)} | 
                                    <i class="fas fa-eye"></i> ${post.views} views
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="post-body">
                        <div class="post-description-full">${escapeHtml(post.description)}</div>
                        <div class="post-actions">
                            ${currentUser ? `
                                <button class="like-btn" onclick="handleLike(${post.id})">
                                    <i class="fas fa-heart"></i> <span id="likeCount">${post.likes}</span>
                                </button>
                            ` : `
                                <button class="like-btn" onclick="showLoginModal()">
                                    <i class="fas fa-heart"></i> Sign in to like
                                </button>
                            `}
                            <button class="share-btn" onclick="shareCurrentPage()">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                        </div>
                        
                        <div class="comments-section">
                            <h3><i class="fas fa-comments"></i> Comments (<span id="commentCount">${post.comments?.length || 0}</span>)</h3>
                            ${currentUser ? `
                                <div class="comment-form">
                                    <textarea id="commentText" placeholder="Write your comment..." rows="2"></textarea>
                                    <button onclick="addComment(${post.id})"><i class="fas fa-paper-plane"></i> Post</button>
                                </div>
                            ` : `
                                <div class="login-prompt" style="text-align: center; padding: 2rem; background: var(--light-gray); border-radius: var(--radius-lg);">
                                    <i class="fas fa-lock"></i>
                                    <p>Please <a onclick="showLoginModal()" style="color: var(--primary); cursor: pointer;">sign in</a> to leave a comment</p>
                                </div>
                            `}
                            <div class="comment-list">
                                ${post.comments?.length ? post.comments.map(comment => `
                                    <div class="comment-item">
                                        <div class="comment-avatar">${comment.author?.avatar || comment.author?.username?.charAt(0).toUpperCase() || 'U'}</div>
                                        <div style="flex: 1;">
                                            <div class="comment-header">
                                                <span class="comment-author">
                                                    ${escapeHtml(comment.author?.username || 'Unknown')}
                                                    ${comment.author?.role ? `<span class="role-badge role-${comment.author.role}">${comment.author.role}</span>` : ''}
                                                </span>
                                                <span class="comment-date">${timeAgo(comment.created_at)}</span>
                                            </div>
                                            <div class="comment-text">${escapeHtml(comment.comment)}</div>
                                        </div>
                                    </div>
                                `).join('') : '<div style="text-align: center; padding: 2rem; color: var(--gray);">No comments yet. Be the first to comment!</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

async function renderCategories() {
    const categories = await PonleuAPI.categories.getAll();
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-th-large"></i> All Categories</h2>
                    <button class="btn-outline" onclick="navigate('home')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <div class="categories-grid">
                    ${categories.map(cat => `
                        <div class="category-card" onclick="navigate('category', {slug: '${cat.slug}'})">
                            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
                            <div class="category-name">${escapeHtml(cat.name)}</div>
                            <div class="category-count">${cat.post_count} works</div>
                            <p style="font-size: 0.75rem; color: var(--gray); margin-top: 0.5rem;">${escapeHtml(cat.description?.substring(0, 60))}...</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

async function renderCategoryPosts(slug) {
    const categories = await PonleuAPI.categories.getAll();
    const category = categories.find(c => c.slug === slug);
    
    if (!category) {
        renderNotFound();
        return;
    }
    
    const allPosts = await PonleuAPI.posts.getAll();
    const posts = allPosts.filter(p => p.category_id === category.id);
    
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas ${category.icon}"></i> ${escapeHtml(category.name)}</h2>
                    <button class="btn-outline" onclick="navigate('categories')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <p style="margin-bottom: 2rem; color: var(--gray);">${escapeHtml(category.description)}</p>
                <div class="posts-grid">
                    ${posts.map(post => renderPostCard(post)).join('')}
                </div>
                ${posts.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No works in this category yet</p>
                        ${PonleuAPI.auth.canCreatePost() ? `<button class="btn-primary" onclick="navigate('create-post')">Create First Post</button>` : ''}
                    </div>
                ` : ''}
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

async function renderProfile() {
    const currentUser = PonleuAPI.auth.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const allPosts = await PonleuAPI.posts.getAll();
    const myPosts = allPosts.filter(p => p.user_id === currentUser.id);
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
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

async function renderMyPosts() {
    const currentUser = PonleuAPI.auth.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const allPosts = await PonleuAPI.posts.getAll();
    const myPosts = allPosts.filter(p => p.user_id === currentUser.id);
    
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
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

function renderCreatePost() {
    const currentUser = PonleuAPI.auth.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
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
                            <select id="postCategory" required></select>
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
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
    
    // Load categories into select
    loadCategoriesIntoSelect();
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
                        ${!PonleuAPI.auth.getCurrentUser() ? 
                            `<button class="btn-primary" onclick="showRegisterModal()" style="background: white; color: #6366f1; margin-top: 1rem;">Sign Up Now</button>` : ''
                        }
                    </div>
                </div>
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

function renderNotFound() {
    const html = `
        <section class="section">
            <div class="container">
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Page Not Found</h3>
                    <p>The page you're looking for doesn't exist.</p>
                    <button class="btn-primary" onclick="navigate('home')">Back to Home</button>
                </div>
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

function renderPostCard(post, rank = null, isFeatured = false) {
    return `
        <div class="${isFeatured ? 'featured-card' : 'post-card'}" onclick="navigate('post', {id: ${post.id}})">
            ${rank ? `<div class="featured-rank">#${rank}</div>` : ''}
            <div class="${isFeatured ? 'featured-image' : 'post-image'}">
                <div class="file-badge"><i class="fas fa-file-alt"></i> ${post.category?.name || 'General'}</div>
            </div>
            <div class="${isFeatured ? 'featured-content' : 'post-content'}">
                <div class="post-meta">
                    <div class="post-author">
                        <div class="post-author-avatar">${post.author?.avatar || post.author?.username?.charAt(0).toUpperCase() || 'U'}</div>
                        <span>${escapeHtml(post.author?.username || 'Unknown')}</span>
                        ${post.author?.role ? `<span class="role-badge role-${post.author.role}">${post.author.role}</span>` : ''}
                    </div>
                    <span class="post-category">${post.category?.name || 'General'}</span>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-description">${escapeHtml(post.description?.substring(0, 100))}...</p>
                <div class="post-stats">
                    <span><i class="fas fa-heart" style="color: #ef4444;"></i> ${post.likes}</span>
                    <span><i class="fas fa-eye"></i> ${post.views}</span>
                    <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

// =====================================================
// Action Handlers
// =====================================================

async function handleCreatePost(event) {
    event.preventDefault();
    
    const currentUser = PonleuAPI.auth.getCurrentUser();
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
    
    await PonleuAPI.posts.create(newPost);
    showLoading(false);
    showToast('Work published successfully!');
    navigate('my-posts');
}

async function handleLike(postId) {
    const currentUser = PonleuAPI.auth.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const result = await PonleuAPI.posts.toggleLike(postId, currentUser.id);
    const likeCountSpan = document.getElementById('likeCount');
    const likeBtn = document.querySelector('.like-btn');
    
    if (likeCountSpan) {
        likeCountSpan.textContent = result.likes;
    }
    
    if (likeBtn) {
        if (result.liked) {
            likeBtn.classList.add('liked');
            showToast('You liked this work!');
        } else {
            likeBtn.classList.remove('liked');
            showToast('You removed your like');
        }
    }
}

async function addComment(postId) {
    const currentUser = PonleuAPI.auth.getCurrentUser();
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const commentText = document.getElementById('commentText')?.value.trim();
    if (!commentText) {
        showToast('Please enter a comment', 'error');
        return;
    }
    
    showLoading(true);
    await PonleuAPI.comments.add(postId, currentUser.id, commentText);
    showLoading(false);
    showToast('Comment posted successfully!');
    navigate('post', { id: postId });
}

async function loadCategoriesIntoSelect() {
    const categories = await PonleuAPI.categories.getAll();
    const select = document.getElementById('postCategory');
    if (select) {
        select.innerHTML = categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
    }
}

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
    const allPosts = await PonleuAPI.posts.getAll();
    const results = allPosts.filter(post => 
        post.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (post.description && post.description.toLowerCase().includes(keyword.toLowerCase())) ||
        (post.author && post.author.username.toLowerCase().includes(keyword.toLowerCase()))
    );
    showLoading(false);
    
    renderSearchResults(results, keyword);
}

function renderSearchResults(posts, keyword) {
    const html = `
        <section class="section">
            <div class="container">
                <div class="section-header">
                    <h2><i class="fas fa-search"></i> Search Results for "${escapeHtml(keyword)}"</h2>
                    <button class="btn-outline" onclick="navigate('home')"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
                <div class="posts-grid">
                    ${posts.map(post => renderPostCard(post)).join('')}
                </div>
                ${posts.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No results found for "${escapeHtml(keyword)}"</p>
                        <button class="btn-primary" onclick="navigate('home')">Back to Home</button>
                    </div>
                ` : ''}
            </div>
        </section>
    `;
    
    if (DOM.mainContent) DOM.mainContent.innerHTML = html;
}

function shareCurrentPage() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
    }
}

// =====================================================
// Mobile Menu
// =====================================================

function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            if (menuOverlay) menuOverlay.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            navMenu?.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// =====================================================
// Scroll to Top
// =====================================================

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
    DOM.mainContent = document.getElementById('mainContent');
    DOM.loadingOverlay = document.getElementById('loadingOverlay');
    DOM.toast = document.getElementById('toast');
    
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
    
    // Set global functions for onclick
    window.PonleuApp = {
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
        handleLike,
        addComment,
        handleCreatePost
    };
    
    // Load home page
    navigate('home');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);