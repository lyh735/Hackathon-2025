const db = require('../db');

const Starting = {
    // Get starting information for a user
    getStartingInfo: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    starting_id,
                    user_id,
                    title,
                    description,
                    status,
                    start_date,
                    created_at
                FROM startings
                WHERE user_id = $1
                ORDER BY start_date DESC
                LIMIT 1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving starting info:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(null, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getStartingInfo:', error);
            callback(error, null);
        }
    },

    // Get all startings for a user
    getUserStartings: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    starting_id,
                    user_id,
                    title,
                    description,
                    status,
                    start_date,
                    created_at
                FROM startings
                WHERE user_id = $1
                ORDER BY start_date DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving user startings:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getUserStartings:', error);
            callback(error, null);
        }
    },

    // Get starting by ID
    getStartingById: (startingId, userId, callback) => {
        try {
            if (!startingId || !userId) {
                return callback(new Error('Starting ID and User ID are required'), null);
            }

            const query = `
                SELECT 
                    starting_id,
                    user_id,
                    title,
                    description,
                    status,
                    start_date,
                    created_at
                FROM startings
                WHERE starting_id = $1 AND user_id = $2
            `;

            db.query(query, [startingId, userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving starting by ID:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Starting not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getStartingById:', error);
            callback(error, null);
        }
    },

    // Create starting record when user begins journey
    createStarting: (userId, startingData, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const { title, description, status } = startingData;

            if (!title || !description) {
                return callback(new Error('Title and description are required'), null);
            }

            const query = `
                INSERT INTO startings (user_id, title, description, status, start_date, created_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING starting_id, user_id, title, description, status, start_date, created_at
            `;

            db.query(query, [userId, title, description, status || 'active'], (err, results) => {
                if (err) {
                    console.error('Error creating starting:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in createStarting:', error);
            callback(error, null);
        }
    },

    // Update starting record
    updateStarting: (startingId, userId, startingData, callback) => {
        try {
            if (!startingId || !userId) {
                return callback(new Error('Starting ID and User ID are required'), null);
            }

            const { title, description, status } = startingData;

            // Check if starting exists
            const checkQuery = `
                SELECT starting_id FROM startings WHERE starting_id = $1 AND user_id = $2
            `;

            db.query(checkQuery, [startingId, userId], (err, checkResults) => {
                if (err) {
                    console.error('Error checking starting existence:', err);
                    return callback(err, null);
                }

                if (checkResults.rows.length === 0) {
                    return callback(new Error('Starting not found'), null);
                }

                // Build dynamic update query
                let query = 'UPDATE startings SET ';
                let params = [];
                let paramCount = 1;

                if (title !== undefined) {
                    query += `title = $${paramCount}`;
                    params.push(title);
                    paramCount++;
                }

                if (description !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `description = $${paramCount}`;
                    params.push(description);
                    paramCount++;
                }

                if (status !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `status = $${paramCount}`;
                    params.push(status);
                    paramCount++;
                }

                if (params.length === 0) {
                    return callback(new Error('No fields to update'), null);
                }

                query += ` WHERE starting_id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING starting_id, user_id, title, description, status, start_date, created_at`;
                params.push(startingId);
                params.push(userId);

                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Error updating starting:', err);
                        return callback(err, null);
                    }

                    callback(null, results.rows[0]);
                });
            });
        } catch (error) {
            console.error('Error in updateStarting:', error);
            callback(error, null);
        }
    },

    // Get starting with user profile
    getStartingWithUserProfile: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    s.starting_id,
                    s.user_id,
                    s.title,
                    s.description,
                    s.status,
                    s.start_date,
                    s.created_at,
                    u.name,
                    u.email,
                    u.age,
                    u.total_points
                FROM startings s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.user_id = $1
                ORDER BY s.start_date DESC
                LIMIT 1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving starting with user profile:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(null, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getStartingWithUserProfile:', error);
            callback(error, null);
        }
    },

    // Get starting statistics
    getStartingStats: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM startings WHERE user_id = $1) as total_startings,
                    (SELECT MIN(start_date) FROM startings WHERE user_id = $1) as first_start_date,
                    (SELECT MAX(start_date) FROM startings WHERE user_id = $1) as latest_start_date,
                    (SELECT status FROM startings WHERE user_id = $1 ORDER BY start_date DESC LIMIT 1) as current_status
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving starting stats:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0] || {
                    total_startings: 0,
                    first_start_date: null,
                    latest_start_date: null,
                    current_status: null
                });
            });
        } catch (error) {
            console.error('Error in getStartingStats:', error);
            callback(error, null);
        }
    },

    // Check if user has started journey
    hasStartedJourney: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM startings WHERE user_id = $1 AND status = 'active') 
                        THEN true 
                        ELSE false 
                    END as journey_started
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error checking journey start:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in hasStartedJourney:', error);
            callback(error, null);
        }
    },

    // Get user journey progress
    getJourneyProgress: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    s.starting_id,
                    s.user_id,
                    s.title,
                    s.description,
                    s.status,
                    s.start_date,
                    (SELECT COUNT(*) FROM mission_completions WHERE user_id = $1 AND complete_status = true) as missions_completed,
                    (SELECT COUNT(*) FROM quiz_results WHERE user_id = $1 AND passed = true) as quizzes_passed,
                    (SELECT COUNT(DISTINCT volunteer_id) FROM volunteer_registrations WHERE user_id = $1) as volunteer_activities,
                    u.total_points
                FROM startings s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.user_id = $1
                ORDER BY s.start_date DESC
                LIMIT 1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving journey progress:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Starting journey not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getJourneyProgress:', error);
            callback(error, null);
        }
    }
};

module.exports = Starting;
