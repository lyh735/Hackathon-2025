const db = require('../db');

// List all missions available for the logged-in user
const listAllMissions = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Retrieve all available missions with user's completion status
        const query = `
            SELECT m.*, 
                   CASE WHEN mc.mission_id IS NOT NULL THEN 1 ELSE 0 END as is_completed_today,
                   mc.completed_date,
                   mc.completion_count
            FROM missions m
            LEFT JOIN mission_completions mc ON m.id = mc.mission_id 
                AND mc.user_id = ? 
                AND DATE(mc.completed_date) = CURDATE()
            ORDER BY m.created_at DESC
        `;

        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error retrieving missions:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            res.status(200).json({
                success: true,
                data: results,
                count: results.length,
                message: 'Missions retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listAllMissions:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get mission by ID
const getMissionById = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const missionId = req.params.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!missionId) {
            return res.status(400).json({
                success: false,
                message: 'Mission ID is required'
            });
        }

        const query = `
            SELECT m.*, 
                   CASE WHEN mc.mission_id IS NOT NULL THEN 1 ELSE 0 END as is_completed_today,
                   mc.completed_date,
                   mc.completion_count
            FROM missions m
            LEFT JOIN mission_completions mc ON m.id = mc.mission_id 
                AND mc.user_id = ? 
                AND DATE(mc.completed_date) = CURDATE()
            WHERE m.id = ?
        `;

        db.query(query, [userId, missionId], (err, results) => {
            if (err) {
                console.error('Error retrieving mission:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Mission not found'
                });
            }

            res.status(200).json({
                success: true,
                data: results[0],
                message: 'Mission retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getMissionById:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Complete a mission (once daily per mission)
const completeMission = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const missionId = req.params.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!missionId) {
            return res.status(400).json({
                success: false,
                message: 'Mission ID is required'
            });
        }

        // Check if mission exists
        db.query('SELECT * FROM missions WHERE id = ?', [missionId], (err, missionResults) => {
            if (err) {
                console.error('Error checking mission:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (missionResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Mission not found'
                });
            }

            const mission = missionResults[0];

            // Check if mission was already completed today
            const checkQuery = `
                SELECT * FROM mission_completions 
                WHERE user_id = ? 
                AND mission_id = ? 
                AND DATE(completed_date) = CURDATE()
            `;

            db.query(checkQuery, [userId, missionId], (err, completionResults) => {
                if (err) {
                    console.error('Error checking daily completion:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }

                if (completionResults.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mission already completed today. Come back tomorrow!'
                    });
                }

                // Insert mission completion record
                const insertQuery = `
                    INSERT INTO mission_completions (user_id, mission_id, completed_date, completion_count)
                    VALUES (?, ?, NOW(), 1)
                    ON DUPLICATE KEY UPDATE 
                        completed_date = NOW(),
                        completion_count = completion_count + 1
                `;

                db.query(insertQuery, [userId, missionId], (err, insertResult) => {
                    if (err) {
                        console.error('Error recording mission completion:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Database error'
                        });
                    }

                    // Update user's reward/points if mission has rewards
                    if (mission.reward_points) {
                        db.query(
                            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
                            [mission.reward_points, userId],
                            (err) => {
                                if (err) {
                                    console.error('Error updating user points:', err);
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error updating user rewards'
                                    });
                                }

                                res.status(200).json({
                                    success: true,
                                    data: {
                                        mission_id: missionId,
                                        reward_points: mission.reward_points,
                                        completed_at: new Date()
                                    },
                                    message: `Mission completed! You earned ${mission.reward_points} points.`
                                });
                            }
                        );
                    } else {
                        res.status(200).json({
                            success: true,
                            data: {
                                mission_id: missionId,
                                completed_at: new Date()
                            },
                            message: 'Mission completed successfully!'
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error in completeMission:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get user's mission completion history
const getUserMissionHistory = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const query = `
            SELECT m.*, mc.completed_date, mc.completion_count
            FROM missions m
            INNER JOIN mission_completions mc ON m.id = mc.mission_id
            WHERE mc.user_id = ?
            ORDER BY mc.completed_date DESC
        `;

        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error retrieving mission history:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            res.status(200).json({
                success: true,
                data: results,
                count: results.length,
                message: 'Mission history retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getUserMissionHistory:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    listAllMissions,
    getMissionById,
    completeMission,
    getUserMissionHistory
};
