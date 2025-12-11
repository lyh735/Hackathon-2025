const Ending = require('../models/Ending');

// Display ending page for users
const displayEnding = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).render('ending', {
                ending: null,
                message: 'Please log in to view your ending'
            });
        }

        Ending.getEndingInfo(userId, (err, ending) => {
            if (err) {
                console.error('Error retrieving ending:', err.message);
                return res.status(500).render('ending', {
                    ending: null,
                    message: 'Error retrieving ending information'
                });
            }

            if (!ending) {
                return res.status(200).render('ending', {
                    ending: null,
                    message: 'No ending information available yet'
                });
            }

            res.render('ending', {
                ending: ending,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayEnding:', error);
        res.status(500).render('ending', {
            ending: null,
            message: 'An unexpected error occurred'
        });
    }
};

// Get ending information as JSON
const getEnding = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Ending.getEndingInfo(userId, (err, ending) => {
            if (err) {
                console.error('Error retrieving ending:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving ending information'
                });
            }

            if (!ending) {
                return res.status(200).json({
                    success: true,
                    data: null,
                    message: 'No ending information available yet'
                });
            }

            res.status(200).json({
                success: true,
                data: ending,
                message: 'Ending information retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getEnding:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get all endings for user
const getUserEndings = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Ending.getUserEndings(userId, (err, endings) => {
            if (err) {
                console.error('Error retrieving endings:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving endings'
                });
            }

            res.status(200).json({
                success: true,
                data: endings,
                count: endings.length,
                message: 'User endings retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getUserEndings:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get ending by ID
const getEndingById = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { endingId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!endingId) {
            return res.status(400).json({
                success: false,
                message: 'Ending ID is required'
            });
        }

        Ending.getEndingById(endingId, userId, (err, ending) => {
            if (err) {
                console.error('Error retrieving ending:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: ending,
                message: 'Ending retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getEndingById:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display ending by ID
const displayEndingById = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { endingId } = req.params;

        if (!userId) {
            return res.status(401).render('ending-details', {
                ending: null,
                message: 'Please log in to view this ending'
            });
        }

        if (!endingId) {
            return res.status(400).render('ending-details', {
                ending: null,
                message: 'Ending ID is required'
            });
        }

        Ending.getEndingById(endingId, userId, (err, ending) => {
            if (err) {
                console.error('Error retrieving ending:', err.message);
                return res.status(404).render('ending-details', {
                    ending: null,
                    message: err.message
                });
            }

            res.render('ending-details', {
                ending: ending,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayEndingById:', error);
        res.status(500).render('ending-details', {
            ending: null,
            message: 'An unexpected error occurred'
        });
    }
};

// Get ending summary with user statistics
const getEndingSummary = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Ending.getEndingSummary(userId, (err, summary) => {
            if (err) {
                console.error('Error retrieving ending summary:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: summary,
                message: 'Ending summary retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getEndingSummary:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display ending summary view
const displayEndingSummary = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).render('ending-summary', {
                summary: null,
                message: 'Please log in to view your summary'
            });
        }

        Ending.getEndingSummary(userId, (err, summary) => {
            if (err) {
                console.error('Error retrieving ending summary:', err.message);
                return res.status(404).render('ending-summary', {
                    summary: null,
                    message: err.message
                });
            }

            res.render('ending-summary', {
                summary: summary,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayEndingSummary:', error);
        res.status(500).render('ending-summary', {
            summary: null,
            message: 'An unexpected error occurred'
        });
    }
};

// Get ending statistics
const getEndingStats = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Ending.getEndingStats(userId, (err, stats) => {
            if (err) {
                console.error('Error retrieving ending stats:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving statistics'
                });
            }

            res.status(200).json({
                success: true,
                data: stats,
                message: 'Ending statistics retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getEndingStats:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Check if user has completed the journey
const checkJourneyCompletion = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Ending.hasCompletedJourney(userId, (err, result) => {
            if (err) {
                console.error('Error checking journey completion:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error checking journey completion'
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Journey completion status retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in checkJourneyCompletion:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    displayEnding,
    getEnding,
    getUserEndings,
    getEndingById,
    displayEndingById,
    getEndingSummary,
    displayEndingSummary,
    getEndingStats,
    checkJourneyCompletion
};
