const db = require('../db');

const Mission = {
    // Get all missions available for a user
    getAllMissions: (userId, callback) => {
        try {
            const query = `
                SELECT 
                    m.mission_id,
                    m.title,
                    m.description,
                    m.reward_points,
                    m.created_at,
                    CASE 
                        WHEN mc.mission_id IS NOT NULL 
                        AND DATE(mc.date_completed) = CURRENT_DATE 
                        THEN true 
                        ELSE false 
                    END as completed_today,
                    mc.date_completed,
                    mc.complete_status
                FROM missions m
                LEFT JOIN mission_completions mc 
                    ON m.mission_id = mc.mission_id 
                    AND mc.user_id = $1
                ORDER BY m.created_at DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving all missions:', err);
                    return callback(err, null);
                }
                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getAllMissions:', error);
            callback(error, null);
        }
    },

    // Get mission by ID
    getMissionById: (missionId, userId, callback) => {
        try {
            if (!missionId) {
                return callback(new Error('Mission ID is required'), null);
            }

            const query = `
                SELECT 
                    m.mission_id,
                    m.title,
                    m.description,
                    m.reward_points,
                    m.created_at,
                    CASE 
                        WHEN mc.mission_id IS NOT NULL 
                        AND DATE(mc.date_completed) = CURRENT_DATE 
                        THEN true 
                        ELSE false 
                    END as completed_today,
                    mc.date_completed,
                    mc.complete_status,
                    COUNT(mc.mission_id) OVER (PARTITION BY mc.mission_id, mc.user_id) as total_completions
                FROM missions m
                LEFT JOIN mission_completions mc 
                    ON m.mission_id = mc.mission_id 
                    AND mc.user_id = $1
                WHERE m.mission_id = $2
            `;

            db.query(query, [userId, missionId], (err, results) => {
                if (err) {
                    console.error('Error retrieving mission by ID:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Mission not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getMissionById:', error);
            callback(error, null);
        }
    },

    // Complete a mission (once daily per mission)
    completeMission: (missionId, userId, callback) => {
        try {
            if (!missionId || !userId) {
                return callback(new Error('Mission ID and User ID are required'), null);
            }

            // Check if mission exists
            const checkMissionQuery = `
                SELECT mission_id, reward_points 
                FROM missions 
                WHERE mission_id = $1
            `;

            db.query(checkMissionQuery, [missionId], (err, missionResults) => {
                if (err) {
                    console.error('Error checking mission existence:', err);
                    return callback(err, null);
                }

                if (missionResults.rows.length === 0) {
                    return callback(new Error('Mission not found'), null);
                }

                const mission = missionResults.rows[0];

                // Check if mission was already completed today
                const checkCompletionQuery = `
                    SELECT mission_id, complete_status, date_completed
                    FROM mission_completions
                    WHERE user_id = $1 
                    AND mission_id = $2 
                    AND DATE(date_completed) = CURRENT_DATE
                `;

                db.query(checkCompletionQuery, [userId, missionId], (err, completionResults) => {
                    if (err) {
                        console.error('Error checking daily completion:', err);
                        return callback(err, null);
                    }

                    if (completionResults.rows.length > 0) {
                        return callback(
                            new Error('Mission already completed today. Come back tomorrow!'),
                            null
                        );
                    }

                    // Insert or update mission completion record
                    const insertCompletionQuery = `
                        INSERT INTO mission_completions 
                        (user_id, mission_id, complete_status, date_completed)
                        VALUES ($1, $2, true, NOW())
                        ON CONFLICT (user_id, mission_id) 
                        DO UPDATE SET 
                            complete_status = true,
                            date_completed = NOW()
                        RETURNING mission_id, complete_status, date_completed
                    `;

                    db.query(insertCompletionQuery, [userId, missionId], (err, insertResult) => {
                        if (err) {
                            console.error('Error recording mission completion:', err);
                            return callback(err, null);
                        }

                        // Update user's reward points if mission has rewards
                        if (mission.reward_points) {
                            const updatePointsQuery = `
                                UPDATE users 
                                SET total_points = total_points + $1
                                WHERE user_id = $2
                                RETURNING user_id, total_points
                            `;

                            db.query(updatePointsQuery, [mission.reward_points, userId], (err, userResult) => {
                                if (err) {
                                    console.error('Error updating user points:', err);
                                    return callback(err, null);
                                }

                                callback(null, {
                                    mission_id: missionId,
                                    complete_status: true,
                                    date_completed: insertResult.rows[0].date_completed,
                                    reward_points: mission.reward_points,
                                    user_total_points: userResult.rows[0].total_points
                                });
                            });
                        } else {
                            callback(null, {
                                mission_id: missionId,
                                complete_status: true,
                                date_completed: insertResult.rows[0].date_completed
                            });
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Error in completeMission:', error);
            callback(error, null);
        }
    },

    // Get mission completion history for a user
    getUserMissionHistory: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    m.mission_id,
                    m.title,
                    m.description,
                    m.reward_points,
                    mc.complete_status,
                    mc.date_completed,
                    COUNT(*) OVER (PARTITION BY mc.mission_id, mc.user_id) as total_completions
                FROM missions m
                INNER JOIN mission_completions mc 
                    ON m.mission_id = mc.mission_id
                WHERE mc.user_id = $1
                ORDER BY mc.date_completed DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving user mission history:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getUserMissionHistory:', error);
            callback(error, null);
        }
    },

    // Check if a mission is available for completion today
    checkMissionAvailability: (missionId, userId, callback) => {
        try {
            if (!missionId || !userId) {
                return callback(new Error('Mission ID and User ID are required'), null);
            }

            const query = `
                SELECT 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM mission_completions 
                            WHERE user_id = $1 
                            AND mission_id = $2 
                            AND DATE(date_completed) = CURRENT_DATE
                        ) 
                        THEN false 
                        ELSE true 
                    END as is_available
            `;

            db.query(query, [userId, missionId], (err, results) => {
                if (err) {
                    console.error('Error checking mission availability:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in checkMissionAvailability:', error);
            callback(error, null);
        }
    },

    // Get total missions completed by user
    getTotalMissionsCompleted: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    COUNT(DISTINCT mission_id) as total_missions_completed,
                    COUNT(*) as total_completions,
                    SUM(m.reward_points) as total_rewards_earned
                FROM mission_completions mc
                INNER JOIN missions m ON mc.mission_id = m.mission_id
                WHERE mc.user_id = $1
                AND mc.complete_status = true
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving total missions completed:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getTotalMissionsCompleted:', error);
            callback(error, null);
        }
    },

    // Create a new mission (admin only)
    createMission: (missionData, callback) => {
        try {
            const { title, description, reward_points, category, difficulty_level } = missionData;

            // Validate required fields
            if (!title || !description || reward_points === undefined) {
                return callback(new Error('Title, description, and reward points are required'), null);
            }

            // Validate reward points
            if (isNaN(reward_points) || reward_points < 0) {
                return callback(new Error('Reward points must be a non-negative number'), null);
            }

            const query = `
                INSERT INTO missions (title, description, reward_points, category, difficulty_level, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING mission_id, title, description, reward_points, category, difficulty_level, created_at
            `;

            db.query(query, [title, description, reward_points, category || null, difficulty_level || null], (err, results) => {
                if (err) {
                    console.error('Error creating mission:', err);
                    return callback(err, null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in createMission:', error);
            callback(error, null);
        }
    },

    // Update mission (admin only)
    updateMission: (missionId, missionData, callback) => {
        try {
            if (!missionId) {
                return callback(new Error('Mission ID is required'), null);
            }

            const { title, description, reward_points, category, difficulty_level } = missionData;

            // Check if mission exists
            const checkQuery = `
                SELECT mission_id FROM missions WHERE mission_id = $1
            `;

            db.query(checkQuery, [missionId], (err, checkResults) => {
                if (err) {
                    console.error('Error checking mission existence:', err);
                    return callback(err, null);
                }

                if (checkResults.rows.length === 0) {
                    return callback(new Error('Mission not found'), null);
                }

                // Validate reward points if provided
                if (reward_points !== undefined && (isNaN(reward_points) || reward_points < 0)) {
                    return callback(new Error('Reward points must be a non-negative number'), null);
                }

                // Build dynamic update query
                let query = 'UPDATE missions SET ';
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

                if (reward_points !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `reward_points = $${paramCount}`;
                    params.push(reward_points);
                    paramCount++;
                }

                if (category !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `category = $${paramCount}`;
                    params.push(category);
                    paramCount++;
                }

                if (difficulty_level !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `difficulty_level = $${paramCount}`;
                    params.push(difficulty_level);
                    paramCount++;
                }

                if (params.length === 0) {
                    return callback(new Error('No fields to update'), null);
                }

                query += ` WHERE mission_id = $${paramCount} RETURNING mission_id, title, description, reward_points, category, difficulty_level`;
                params.push(missionId);

                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Error updating mission:', err);
                        return callback(err, null);
                    }

                    callback(null, results.rows[0]);
                });
            });
        } catch (error) {
            console.error('Error in updateMission:', error);
            callback(error, null);
        }
    },

    // Delete mission (admin only)
    deleteMission: (missionId, callback) => {
        try {
            if (!missionId) {
                return callback(new Error('Mission ID is required'), null);
            }

            // Check if mission exists
            const checkQuery = `
                SELECT mission_id FROM missions WHERE mission_id = $1
            `;

            db.query(checkQuery, [missionId], (err, checkResults) => {
                if (err) {
                    console.error('Error checking mission existence:', err);
                    return callback(err, null);
                }

                if (checkResults.rows.length === 0) {
                    return callback(new Error('Mission not found'), null);
                }

                // Delete associated completion records first
                const deleteCompletionsQuery = `
                    DELETE FROM mission_completions WHERE mission_id = $1
                `;

                db.query(deleteCompletionsQuery, [missionId], (err) => {
                    if (err) {
                        console.error('Error deleting mission completions:', err);
                        return callback(err, null);
                    }

                    // Delete the mission
                    const deleteMissionQuery = `
                        DELETE FROM missions WHERE mission_id = $1 RETURNING mission_id
                    `;

                    db.query(deleteMissionQuery, [missionId], (err, results) => {
                        if (err) {
                            console.error('Error deleting mission:', err);
                            return callback(err, null);
                        }

                        callback(null, { message: 'Mission deleted successfully' });
                    });
                });
            });
        } catch (error) {
            console.error('Error in deleteMission:', error);
            callback(error, null);
        }
    },

    // Get all missions (admin - includes all missions with stats)
    getAllMissionsAdmin: (callback) => {
        try {
            const query = `
                SELECT 
                    m.mission_id,
                    m.title,
                    m.description,
                    m.reward_points,
                    m.category,
                    m.difficulty_level,
                    m.created_at,
                    (SELECT COUNT(*) FROM mission_completions WHERE mission_id = m.mission_id) as total_completions
                FROM missions m
                ORDER BY m.created_at DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Error retrieving all missions for admin:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getAllMissionsAdmin:', error);
            callback(error, null);
        }
    }
};

module.exports = Mission;
