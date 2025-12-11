const db = require('../db');

// Display starting page for users
const displayStarting = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).render('Starting', {
                message: 'Please log in to continue'
            });
        }

        // Retrieve user data from database
        db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error retrieving user data:', err);
                return res.status(500).render('Starting', {
                    message: 'An error occurred while retrieving user data'
                });
            }

            if (results.length === 0) {
                return res.status(404).render('Starting', {
                    message: 'User not found'
                });
            }

            const user = results[0];

            // Render starting view with user data
            res.render('Starting', {
                user: user,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayStarting:', error);
        res.status(500).render('Starting', {
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

        // Query to get starting status
        db.query('SELECT * FROM starting WHERE user_id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error retrieving starting status:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (results.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: null,
                    message: 'No starting data found'
                });
            }

            res.status(200).json({
                success: true,
                data: results[0],
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

        const { title, description, startDate } = req.body;

        // Validate input
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        db.query(
            'INSERT INTO starting (user_id, title, description, start_date, created_at) VALUES (?, ?, ?, ?, NOW())',
            [userId, title, description, startDate || new Date()],
            (err, result) => {
                if (err) {
                    console.error('Error creating starting record:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }

                res.status(201).json({
                    success: true,
                    data: { id: result.insertId },
                    message: 'Starting record created successfully'
                });
            }
        );
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
