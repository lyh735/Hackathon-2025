const db = require('../db');

const Ending = {
    // Get ending information for a user
    getEndingInfo: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    ending_id,
                    user_id,
                    title,
                    description,
                    status,
                    completion_date,
                    created_at
                FROM endings
                WHERE user_id = $1
                ORDER BY completion_date DESC
                LIMIT 1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving ending info:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(null, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getEndingInfo:', error);
            callback(error, null);
        }
    },

    // Get all endings for a user
    getUserEndings: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    ending_id,
                    user_id,
                    title,
                    description,
                    status,
                    completion_date,
                    created_at
                FROM endings
                WHERE user_id = $1
                ORDER BY completion_date DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving user endings:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getUserEndings:', error);
            callback(error, null);
        }
    },

    // Get ending by ID
    getEndingById: (endingId, userId, callback) => {
        try {
            if (!endingId || !userId) {
                return callback(new Error('Ending ID and User ID are required'), null);
            }

            const query = `
                SELECT 
                    ending_id,
                    user_id,
                    title,
                    description,
                    status,
                    completion_date,
                    created_at
                FROM endings
                WHERE ending_id = $1 AND user_id = $2
            `;

            db.query(query, [endingId, userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving ending by ID:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Ending not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getEndingById:', error);
            callback(error, null);
        }
    },

    // Create ending record when user completes journey
    createEnding: (userId, endingData, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const { title, description, status } = endingData;

            if (!title || !description) {
                return callback(new Error('Title and description are required'), null);
            }

            const query = `
                INSERT INTO endings (user_id, title, description, status, completion_date, created_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING ending_id, user_id, title, description, status, completion_date, created_at
            `;

            db.query(query, [userId, title, description, status || 'completed'], (err, results) => {
                if (err) {
                    console.error('Error creating ending:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in createEnding:', error);
            callback(error, null);
        }
    },

    // Get ending summary with user stats
    getEndingSummary: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    u.user_id,
                    u.name,
                    u.email,
                    u.age,
                    u.total_points,
                    (SELECT COUNT(*) FROM mission_completions WHERE user_id = $1 AND complete_status = true) as missions_completed,
                    (SELECT COUNT(*) FROM quiz_results WHERE user_id = $1 AND passed = true) as quizzes_passed,
                    (SELECT COUNT(DISTINCT volunteer_id) FROM volunteer_registrations WHERE user_id = $1) as volunteer_activities,
                    (SELECT COUNT(DISTINCT CASE WHEN user_id_1 = $1 THEN user_id_2 ELSE user_id_1 END) FROM friendships WHERE (user_id_1 = $1 OR user_id_2 = $1) AND status = 'accepted') as total_friends,
                    (SELECT MAX(completion_date) FROM endings WHERE user_id = $1) as last_ending_date
                FROM users u
                WHERE u.user_id = $1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving ending summary:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('User not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getEndingSummary:', error);
            callback(error, null);
        }
    },

    // Get ending statistics
    getEndingStats: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM endings WHERE user_id = $1) as total_endings,
                    (SELECT MAX(completion_date) FROM endings WHERE user_id = $1) as most_recent_ending,
                    (SELECT status FROM endings WHERE user_id = $1 ORDER BY completion_date DESC LIMIT 1) as latest_status
                FROM endings
                WHERE user_id = $1
                LIMIT 1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving ending stats:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0] || {
                    total_endings: 0,
                    most_recent_ending: null,
                    latest_status: null
                });
            });
        } catch (error) {
            console.error('Error in getEndingStats:', error);
            callback(error, null);
        }
    },

    // Check if user has completed the journey
    hasCompletedJourney: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM endings WHERE user_id = $1 AND status = 'completed') 
                        THEN true 
                        ELSE false 
                    END as journey_completed
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error checking journey completion:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in hasCompletedJourney:', error);
            callback(error, null);
        }
    }
};

module.exports = Ending;
