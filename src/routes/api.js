const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const skillsController = require('../controllers/skillsController');
const projectsController = require('../controllers/projectsController');
const postsController = require('../controllers/postsController');
const messagesController = require('../controllers/messagesController');
const dashboardController = require('../controllers/dashboardController');

// --- AUTH ROUTES ---
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);
router.post('/auth/change-password', authMiddleware, authController.changePassword);

// --- PROFILE & SETTINGS ROUTES ---
router.get('/profile', profileController.getProfile);
router.put('/profile', authMiddleware, profileController.updateProfile);
router.put('/profile/settings', authMiddleware, profileController.updateSettings);

// --- SKILLS ROUTES ---
router.get('/skills', skillsController.getSkills);
router.post('/skills', authMiddleware, skillsController.createSkill);
router.put('/skills/:id', authMiddleware, skillsController.updateSkill);
router.delete('/skills/:id', authMiddleware, skillsController.deleteSkill);

// --- PROJECTS / PORTFOLIO ROUTES ---
router.get('/projects', projectsController.getProjects);
router.get('/projects/:id', projectsController.getProject);
router.post('/projects', authMiddleware, projectsController.createProject);
router.put('/projects/:id', authMiddleware, projectsController.updateProject);
router.delete('/projects/:id', authMiddleware, projectsController.deleteProject);
router.post('/upload', authMiddleware, upload.single('image'), projectsController.uploadImage);

// --- BLOG / POSTS ROUTES ---
router.get('/posts', postsController.getPosts);
router.get('/posts/:slug', postsController.getPostBySlug);
router.get('/admin/posts', authMiddleware, postsController.adminGetPosts);
router.post('/posts', authMiddleware, postsController.createPost);
router.put('/posts/:id', authMiddleware, postsController.updatePost);
router.delete('/posts/:id', authMiddleware, postsController.deletePost);

// --- CONTACT / MESSAGES ROUTES ---
router.post('/messages', messagesController.sendMessage);
router.get('/admin/messages', authMiddleware, messagesController.getMessages);
router.put('/admin/messages/:id/read', authMiddleware, messagesController.markAsRead);
router.delete('/admin/messages/:id', authMiddleware, messagesController.deleteMessage);

// --- DASHBOARD METRICS ---
router.get('/admin/dashboard', authMiddleware, dashboardController.getStats);

module.exports = router;
