/**
 * PONLEU API Service
 * Version: 2.0.0
 */

// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://my-json-server.typicode.com/ponleuofficial07-cpu/ponleu-api',
    TIMEOUT: 10000
};

// Storage Keys
const STORAGE_KEYS = {
    CURRENT_USER: 'ponleu_current_user'
};

// =====================================================
// Helper Functions
// =====================================================

function getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

// =====================================================
// API Request Function
// =====================================================

async function apiRequest(endpoint) {
    try {
        const url = `${API_CONFIG.BASE_URL}/${endpoint}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return getFallbackData(endpoint);
    }
}

// Fallback data when API is unavailable
function getFallbackData(endpoint) {
    const fallback = {
        users: JSON.parse(localStorage.getItem('ponleu_users_fallback') || '[]'),
        posts: JSON.parse(localStorage.getItem('ponleu_posts_fallback') || '[]'),
        categories: [
            { id: 1, name: 'Designer', slug: 'designer', icon: 'fa-palette', description: 'Creative design works', is_active: true },
            { id: 2, name: 'Programs', slug: 'programs', icon: 'fa-laptop-code', description: 'Software development', is_active: true },
            { id: 3, name: 'AI', slug: 'ai', icon: 'fa-robot', description: 'Artificial Intelligence', is_active: true },
            { id: 4, name: 'PSD/TIF', slug: 'psd-tif', icon: 'fa-image', description: 'Design source files', is_active: true },
            { id: 5, name: 'PDF/ZIP/RAR', slug: 'pdf-zip-rar', icon: 'fa-file-archive', description: 'Archives', is_active: true }
        ],
        comments: JSON.parse(localStorage.getItem('ponleu_comments_fallback') || '[]'),
        likes: JSON.parse(localStorage.getItem('ponleu_likes_fallback') || '[]'),
        settings: { site_name: 'PONLEU', site_description: 'Creative Platform' }
    };
    
    if (endpoint === 'users') return fallback.users;
    if (endpoint === 'posts') return fallback.posts;
    if (endpoint === 'categories') return fallback.categories;
    if (endpoint === 'comments') return fallback.comments;
    if (endpoint === 'likes') return fallback.likes;
    if (endpoint === 'settings') return fallback.settings;
    if (endpoint.startsWith('posts/')) {
        const id = parseInt(endpoint.split('/')[1]);
        return fallback.posts.find(p => p.id === id);
    }
    
    return [];
}

// =====================================================
// Authentication Functions
// =====================================================

async function login(username, password) {
    const users = await apiRequest('users');
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password && 
        u.is_active === true
    );
    
    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        return { success: true, user: userWithoutPassword };
    }
    return { success: false, message: 'Invalid username or password' };
}

async function register(userData) {
    const { username, email, password, confirmPassword } = userData;
    
    if (password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    if (username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
    }
    
    const users = await apiRequest('users');
    
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Username already exists' };
    }
    
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already exists' };
    }
    
    const newUser = {
        id: users.length + 1,
        username,
        email,
        password,
        role: 'viewer',
        avatar: username.charAt(0).toUpperCase(),
        bio: '',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: null
    };
    
    const fallbackUsers = JSON.parse(localStorage.getItem('ponleu_users_fallback') || '[]');
    fallbackUsers.push(newUser);
    localStorage.setItem('ponleu_users_fallback', JSON.stringify(fallbackUsers));
    
    const { password: _, ...userWithoutPassword } = newUser;
    setCurrentUser(userWithoutPassword);
    return { success: true, user: userWithoutPassword };
}

function logout() {
    clearCurrentUser();
    return { success: true };
}

// =====================================================
// Post Functions
// =====================================================

async function getAllPosts() {
    return await apiRequest('posts');
}

async function getPostById(id) {
    return await apiRequest(`posts/${id}`);
}

async function createPost(postData) {
    const posts = await getAllPosts();
    const newPost = {
        id: posts.length + 1,
        ...postData,
        likes: 0,
        views: 0,
        status: 'published',
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const fallbackPosts = JSON.parse(localStorage.getItem('ponleu_posts_fallback') || '[]');
    fallbackPosts.push(newPost);
    localStorage.setItem('ponleu_posts_fallback', JSON.stringify(fallbackPosts));
    
    return newPost;
}

async function updatePost(postId, postData) {
    const posts = await getAllPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
        posts[index] = { ...posts[index], ...postData, updated_at: new Date().toISOString() };
        localStorage.setItem('ponleu_posts_fallback', JSON.stringify(posts));
    }
    return posts[index];
}

async function deletePost(postId) {
    const posts = await getAllPosts();
    const updatedPosts = posts.filter(p => p.id !== postId);
    localStorage.setItem('ponleu_posts_fallback', JSON.stringify(updatedPosts));
    return true;
}

async function updatePostViews(postId) {
    const posts = await getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.views = (post.views || 0) + 1;
        const fallbackPosts = JSON.parse(localStorage.getItem('ponleu_posts_fallback') || '[]');
        const index = fallbackPosts.findIndex(p => p.id === postId);
        if (index !== -1) {
            fallbackPosts[index].views = post.views;
            localStorage.setItem('ponleu_posts_fallback', JSON.stringify(fallbackPosts));
        }
    }
}

async function toggleLike(postId, userId) {
    const likes = await apiRequest('likes');
    const existingLike = likes.find(l => l.post_id === postId && l.user_id === userId);
    
    let fallbackLikes = JSON.parse(localStorage.getItem('ponleu_likes_fallback') || '[]');
    let fallbackPosts = JSON.parse(localStorage.getItem('ponleu_posts_fallback') || '[]');
    const fallbackPost = fallbackPosts.find(p => p.id === postId);
    
    if (existingLike) {
        fallbackLikes = fallbackLikes.filter(l => !(l.post_id === postId && l.user_id === userId));
        if (fallbackPost) fallbackPost.likes = Math.max(0, (fallbackPost.likes || 0) - 1);
        localStorage.setItem('ponleu_likes_fallback', JSON.stringify(fallbackLikes));
        localStorage.setItem('ponleu_posts_fallback', JSON.stringify(fallbackPosts));
        return { liked: false, likes: fallbackPost?.likes || 0 };
    } else {
        const newLike = {
            id: fallbackLikes.length + 1,
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
        };
        fallbackLikes.push(newLike);
        if (fallbackPost) fallbackPost.likes = (fallbackPost.likes || 0) + 1;
        localStorage.setItem('ponleu_likes_fallback', JSON.stringify(fallbackLikes));
        localStorage.setItem('ponleu_posts_fallback', JSON.stringify(fallbackPosts));
        return { liked: true, likes: fallbackPost?.likes || 0 };
    }
}

// =====================================================
// Category Functions
// =====================================================

async function getAllCategories() {
    return await apiRequest('categories');
}

async function createCategory(categoryData) {
    const categories = await getAllCategories();
    const newCategory = {
        id: categories.length + 1,
        ...categoryData,
        is_active: true,
        order: categories.length + 1
    };
    
    const fallbackCategories = JSON.parse(localStorage.getItem('ponleu_categories_fallback') || '[]');
    fallbackCategories.push(newCategory);
    localStorage.setItem('ponleu_categories_fallback', JSON.stringify(fallbackCategories));
    
    return newCategory;
}

async function updateCategory(categoryId, categoryData) {
    const categories = await getAllCategories();
    const index = categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
        categories[index] = { ...categories[index], ...categoryData };
        localStorage.setItem('ponleu_categories_fallback', JSON.stringify(categories));
    }
    return categories[index];
}

async function deleteCategory(categoryId) {
    const categories = await getAllCategories();
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    localStorage.setItem('ponleu_categories_fallback', JSON.stringify(updatedCategories));
    return true;
}

// =====================================================
// User Functions (Admin)
// =====================================================

async function getAllUsers() {
    return await apiRequest('users');
}

async function updateUserRole(userId, role) {
    const users = await getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].role = role;
        localStorage.setItem('ponleu_users_fallback', JSON.stringify(users));
    }
    return users[index];
}

async function toggleUserStatus(userId) {
    const users = await getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].is_active = !users[index].is_active;
        localStorage.setItem('ponleu_users_fallback', JSON.stringify(users));
    }
    return users[index];
}

async function deleteUser(userId) {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        return { success: false, message: 'Cannot delete your own account' };
    }
    
    const users = await getAllUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('ponleu_users_fallback', JSON.stringify(updatedUsers));
    return { success: true };
}

// =====================================================
// Comment Functions
// =====================================================

async function getCommentsByPost(postId) {
    const comments = await apiRequest('comments');
    return comments.filter(c => c.post_id === postId && c.status === 'approved');
}

async function addComment(postId, userId, content) {
    const comments = await apiRequest('comments');
    const newComment = {
        id: comments.length + 1,
        post_id: postId,
        user_id: userId,
        comment: content,
        status: 'approved',
        created_at: new Date().toISOString()
    };
    
    const fallbackComments = JSON.parse(localStorage.getItem('ponleu_comments_fallback') || '[]');
    fallbackComments.push(newComment);
    localStorage.setItem('ponleu_comments_fallback', JSON.stringify(fallbackComments));
    
    return newComment;
}

async function deleteComment(commentId) {
    const comments = await apiRequest('comments');
    const updatedComments = comments.filter(c => c.id !== commentId);
    localStorage.setItem('ponleu_comments_fallback', JSON.stringify(updatedComments));
    return true;
}

// =====================================================
// Stats Functions
// =====================================================

async function getSiteStats() {
    const [posts, users, comments, categories] = await Promise.all([
        getAllPosts(),
        getAllUsers(),
        apiRequest('comments'),
        getAllCategories()
    ]);
    
    return {
        total_posts: posts.length,
        total_published: posts.filter(p => p.status === 'published').length,
        total_draft: posts.filter(p => p.status === 'draft').length,
        total_users: users.length,
        total_active_users: users.filter(u => u.is_active === true).length,
        total_comments: comments.length,
        total_likes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
        total_views: posts.reduce((sum, p) => sum + (p.views || 0), 0),
        total_categories: categories.length
    };
}

// =====================================================
// Export for global use
// =====================================================

window.PonleuAPI = {
    // Auth
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    isAdmin,
    isLoggedIn,
    login,
    register,
    logout,
    
    // Posts
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    updatePostViews,
    toggleLike,
    
    // Categories
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Users (Admin)
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    
    // Comments
    getCommentsByPost,
    addComment,
    deleteComment,
    
    // Stats
    getSiteStats,
    
    // Fallback
    getFallbackData
};