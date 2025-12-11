const Quiz = require('../models/Quiz');

// Helper function to check if user is admin
const isAdmin = (req) => {
    return req.session.user && req.session.user.role === 'admin';
};

// List all quizzes for users
const listAllQuizzes = (req, res) => {
    try {
        Quiz.getAllQuizzes((err, quizzes) => {
            if (err) {
                console.error('Error retrieving quizzes:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving quizzes'
                });
            }

            res.status(200).json({
                success: true,
                data: quizzes,
                count: quizzes.length,
                message: 'Quizzes retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listAllQuizzes:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display all quizzes view
const displayAllQuizzes = (req, res) => {
    try {
        Quiz.getAllQuizzes((err, quizzes) => {
            if (err) {
                console.error('Error retrieving quizzes:', err.message);
                return res.status(500).render('quiz', {
                    quizzes: [],
                    message: 'Error retrieving quizzes'
                });
            }

            res.render('quiz', {
                quizzes: quizzes,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayAllQuizzes:', error);
        res.status(500).render('quiz', {
            quizzes: [],
            message: 'An unexpected error occurred'
        });
    }
};

// Get quiz by ID
const getQuizById = (req, res) => {
    try {
        const { quizId } = req.params;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        Quiz.getQuizById(quizId, (err, quiz) => {
            if (err) {
                console.error('Error retrieving quiz:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: quiz,
                message: 'Quiz retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getQuizById:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display quiz details and questions view
const displayQuizDetails = (req, res) => {
    try {
        const { quizId } = req.params;

        if (!quizId) {
            return res.status(400).render('quiz-details', {
                quiz: null,
                questions: [],
                message: 'Quiz ID is required'
            });
        }

        Quiz.getQuizById(quizId, (err, quiz) => {
            if (err) {
                console.error('Error retrieving quiz:', err.message);
                return res.status(404).render('quiz-details', {
                    quiz: null,
                    questions: [],
                    message: err.message
                });
            }

            // Get quiz questions
            Quiz.getQuizQuestions(quizId, (err, questions) => {
                if (err) {
                    console.error('Error retrieving questions:', err.message);
                    return res.status(500).render('quiz-details', {
                        quiz: quiz,
                        questions: [],
                        message: 'Error retrieving questions'
                    });
                }

                res.render('quiz-details', {
                    quiz: quiz,
                    questions: questions,
                    message: null
                });
            });
        });
    } catch (error) {
        console.error('Error in displayQuizDetails:', error);
        res.status(500).render('quiz-details', {
            quiz: null,
            questions: [],
            message: 'An unexpected error occurred'
        });
    }
};

// Submit quiz answers
const submitQuiz = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { quizId } = req.params;
        const { answers } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Quiz answers are required'
            });
        }

        Quiz.submitQuizAnswers(userId, quizId, answers, (err, result) => {
            if (err) {
                console.error('Error submitting quiz:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: result.passed ? 'Quiz passed! You earned points.' : 'Quiz completed. Better luck next time!'
            });
        });
    } catch (error) {
        console.error('Error in submitQuiz:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get user's quiz result
const getUserQuizResult = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { quizId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        Quiz.getUserQuizResult(userId, quizId, (err, result) => {
            if (err) {
                console.error('Error retrieving quiz result:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Quiz result retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getUserQuizResult:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display user's quiz result
const displayUserQuizResult = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { quizId } = req.params;

        if (!userId) {
            return res.status(401).render('quiz-result', {
                result: null,
                message: 'Please log in to view results'
            });
        }

        if (!quizId) {
            return res.status(400).render('quiz-result', {
                result: null,
                message: 'Quiz ID is required'
            });
        }

        Quiz.getUserQuizResult(userId, quizId, (err, result) => {
            if (err) {
                console.error('Error retrieving quiz result:', err.message);
                return res.status(404).render('quiz-result', {
                    result: null,
                    message: err.message
                });
            }

            res.render('quiz-result', {
                result: result,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayUserQuizResult:', error);
        res.status(500).render('quiz-result', {
            result: null,
            message: 'An unexpected error occurred'
        });
    }
};

// Get user's quiz history
const getUserQuizHistory = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Quiz.getUserQuizHistory(userId, (err, history) => {
            if (err) {
                console.error('Error retrieving quiz history:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving quiz history'
                });
            }

            res.status(200).json({
                success: true,
                data: history,
                message: 'Quiz history retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getUserQuizHistory:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get all quiz results (admin only)
const getQuizResults = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can view all quiz results'
            });
        }

        const { quizId } = req.params;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        Quiz.getQuizResults(quizId, (err, results) => {
            if (err) {
                console.error('Error retrieving quiz results:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving quiz results'
                });
            }

            res.status(200).json({
                success: true,
                data: results,
                message: 'Quiz results retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getQuizResults:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Update quiz (admin only)
const updateQuiz = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update quizzes'
            });
        }

        const { quizId } = req.params;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        const { title, description, category, difficulty_level, reward_points, time_limit, passing_score, status } = req.body;

        // Validate at least one field is provided
        if (!title && !description && !category && !difficulty_level && reward_points === undefined && time_limit === undefined && passing_score === undefined && !status) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required to update'
            });
        }

        // Validate numeric fields if provided
        if (reward_points !== undefined && (isNaN(reward_points) || reward_points < 0)) {
            return res.status(400).json({
                success: false,
                message: 'Reward points must be a non-negative number'
            });
        }

        if (time_limit !== undefined && (isNaN(time_limit) || time_limit <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Time limit must be a positive number (in minutes)'
            });
        }

        if (passing_score !== undefined && (isNaN(passing_score) || passing_score < 0 || passing_score > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Passing score must be between 0 and 100'
            });
        }

        // Validate status if provided
        const validStatuses = ['active', 'inactive', 'archived'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: active, inactive, or archived'
            });
        }

        const quizData = {
            title,
            description,
            category,
            difficulty_level,
            reward_points,
            time_limit,
            passing_score,
            status
        };

        Quiz.updateQuiz(quizId, quizData, (err, updatedQuiz) => {
            if (err) {
                console.error('Error updating quiz:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: updatedQuiz,
                message: 'Quiz updated successfully'
            });
        });
    } catch (error) {
        console.error('Error in updateQuiz:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get quiz statistics (admin only)
const getQuizStats = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can view quiz statistics'
            });
        }

        const { quizId } = req.params;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        Quiz.getQuizStats(quizId, (err, stats) => {
            if (err) {
                console.error('Error retrieving quiz stats:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: stats,
                message: 'Quiz statistics retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getQuizStats:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    listAllQuizzes,
    displayAllQuizzes,
    getQuizById,
    displayQuizDetails,
    submitQuiz,
    getUserQuizResult,
    displayUserQuizResult,
    getUserQuizHistory,
    getQuizResults,
    updateQuiz,
    getQuizStats
};
