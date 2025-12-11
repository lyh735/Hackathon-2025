const Starting = require('../models/Starting');
const User = require('../models/User');

// Display starting page for users
const displayStarting = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).render('starting', {
                message: 'Please log in to continue'
            });
        }

        // Retrieve user data from database
        User.getUserById(userId, (err, user) => {
            if (err) {
                console.error('Error retrieving user data:', err);
                return res.status(500).render('starting', {
                    message: 'An error occurred while retrieving user data'
                });
            }

            if (!user) {
                return res.status(404).render('starting', {
                    message: 'User not found'
                });
            }

            // Render starting view with user data
            res.render('starting', {
                user: user,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayStarting:', error);
        res.status(500).render('starting', {
            message: 'An unexpected error occurred'
        });
    }
};

// Get starting status for API calls
const getStartingStatus = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get starting info from model
        Starting.getStartingInfo(userId, (err, starting) => {
            if (err) {
                console.error('Error retrieving starting status:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!starting) {
                return res.status(200).json({
                    success: true,
                    data: null,
                    message: 'No starting data found'
                });
            }

            res.status(200).json({
                success: true,
                data: starting,
                message: 'Starting status retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getStartingStatus:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Create a new starting record
const createStarting = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { title, description } = req.body;

        // Validate input
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title and description'
            });
        }

        const startingData = {
            title,
            description
        };

        Starting.createStarting(userId, startingData, (err, starting) => {
            if (err) {
                console.error('Error creating starting record:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }

            res.status(201).json({
                success: true,
                data: starting,
                message: 'Starting record created successfully'
            });
        });
    } catch (error) {
        console.error('Error in createStarting:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    displayStarting,
    getStartingStatus,
    createStarting
};
