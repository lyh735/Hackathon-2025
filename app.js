const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const db = require('./db');

// Import all controllers
const UserController = require('./controllers/UserController');
const MissionController = require('./controllers/MissionController');
const QuizController = require('./controllers/QuizController');
const GameController = require('./controllers/GameController');
const LogController = require('./controllers/LogController');
const StartingController = require('./controllers/StartingController');
const EndingController = require('./controllers/EndingController');

const app = express();

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: (req, file, cb) => {
        // Accept image files only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).redirect('/login');
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
};

// ==================== Authentication Routes (User) ====================
// Registration
app.get('/register', UserController.showRegister);
app.post('/register', UserController.registerUser);

// Login
app.get('/login', UserController.showLogin);
app.post('/login', UserController.loginUser);

// Logout
app.get('/logout', UserController.logoutUser);

// Profile
app.get('/profile', isAuthenticated, UserController.showProfile);
app.post('/profile/update', isAuthenticated, UserController.updateProfile);
app.post('/profile/delete', isAuthenticated, UserController.deleteAccount);

// ==================== Starting Journey Routes ====================
app.get('/starting', isAuthenticated, StartingController.displayStarting);
app.get('/api/starting/status', isAuthenticated, StartingController.getStartingStatus);
app.post('/api/starting/create', isAuthenticated, StartingController.createStarting);

// ==================== Mission Routes ====================
// User mission routes
app.get('/missions', isAuthenticated, MissionController.listAllMissions);
app.get('/missions/:missionId', isAuthenticated, MissionController.getMissionById);
app.post('/missions/:missionId/complete', isAuthenticated, MissionController.completeMission);
app.get('/missions/history/all', isAuthenticated, MissionController.getUserMissionHistory);

// Admin mission routes
app.get('/admin/missions', isAuthenticated, isAdmin, MissionController.listAllMissionsAdmin);
app.post('/admin/missions/create', isAuthenticated, isAdmin, MissionController.createMission);
app.put('/admin/missions/:missionId', isAuthenticated, isAdmin, MissionController.updateMission);
app.delete('/admin/missions/:missionId', isAuthenticated, isAdmin, MissionController.deleteMission);

// ==================== Quiz Routes ====================
// User quiz routes
app.get('/quizzes', QuizController.listAllQuizzes);
app.get('/quizzes/:quizId', QuizController.getQuizById);
app.get('/quizzes/:quizId/details', QuizController.displayQuizDetails);
app.post('/quizzes/:quizId/submit', isAuthenticated, QuizController.submitQuiz);
app.get('/quizzes/:quizId/result', isAuthenticated, QuizController.getUserQuizResult);
app.get('/quizzes/:quizId/result/display', isAuthenticated, QuizController.displayUserQuizResult);
app.get('/quiz-history', isAuthenticated, QuizController.getUserQuizHistory);

// Admin quiz routes
app.get('/admin/quizzes/:quizId/results', isAuthenticated, isAdmin, QuizController.getQuizResults);
app.put('/admin/quizzes/:quizId', isAuthenticated, isAdmin, QuizController.updateQuiz);
app.get('/admin/quizzes/:quizId/stats', isAuthenticated, isAdmin, QuizController.getQuizStats);

// ==================== Game Routes ====================
// User game routes
app.get('/games', GameController.listAllGames);
app.get('/games/display', GameController.displayAllGames);
app.get('/games/:gameId', GameController.getGameById);
app.get('/games/:gameId/details', GameController.displayGameDetails);
app.get('/games/search', GameController.searchGames);
app.get('/games/difficulty/:difficulty', GameController.getGamesByDifficulty);

// Admin game routes
app.put('/admin/games/:gameId', isAuthenticated, isAdmin, GameController.updateGame);
app.get('/admin/games/:gameId/stats', isAuthenticated, isAdmin, GameController.getGameStats);

// ==================== Activity Log Routes ====================
app.get('/activity-log', isAuthenticated, LogController.displayActivityLog);
app.get('/api/activity-log', isAuthenticated, LogController.getUserActivityLog);
app.get('/api/onboarding-info', isAuthenticated, LogController.getUserOnboardingInfo);
app.get('/api/missions-completed', isAuthenticated, LogController.listCompletedMissions);
app.get('/api/missions/:missionId/completion-details', isAuthenticated, LogController.getMissionCompletionDetails);
app.get('/api/volunteer-activities', isAuthenticated, LogController.listVolunteerActivities);
app.get('/api/volunteer/:volunteerId/details', isAuthenticated, LogController.getVolunteerActivityDetails);
app.get('/api/friends', isAuthenticated, LogController.listUserFriends);
app.get('/api/friends/:friendId/details', isAuthenticated, LogController.getFriendshipDetails);

// ==================== Ending Journey Routes ====================
app.get('/ending', isAuthenticated, EndingController.displayEnding);
app.get('/api/ending', isAuthenticated, EndingController.getEnding);
app.get('/api/endings', isAuthenticated, EndingController.getUserEndings);
app.get('/api/ending/:endingId', isAuthenticated, EndingController.getEndingById);
app.get('/ending/:endingId', isAuthenticated, EndingController.displayEndingById);
app.get('/ending/summary/display', isAuthenticated, EndingController.displayEndingSummary);
app.get('/api/ending/summary', isAuthenticated, EndingController.getEndingSummary);
app.get('/api/ending/stats', isAuthenticated, EndingController.getEndingStats);
app.get('/api/journey/completion-check', isAuthenticated, EndingController.checkJourneyCompletion);

// ==================== Home and Error Routes ====================
// Home page
app.get('/', (req, res) => {
    res.render('index', {
        user: req.session.user || null,
        message: null
    });
});

// Dashboard (after login)
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        user: req.session.user,
        message: null
    });
});

// 404 Not Found
app.use((req, res) => {
    res.status(404).render('404', {
        message: 'Page not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'An unexpected error occurred'
    });
});

// ==================== Server Setup ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
