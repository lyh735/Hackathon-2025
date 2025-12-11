const db = require('../db');

const Log = {
    // Get user onboarding date
    getUserOnboardingDate: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT user_id, created_at as onboarding_date
                FROM users
                WHERE user_id = $1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving onboarding date:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('User not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getUserOnboardingDate:', error);
            callback(error, null);
        }
    },

    // List all missions user has completed with dates
    listCompletedMissions: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    m.mission_id,
                    m.title as mission_name,
                    m.description,
                    m.reward_points,
                    mc.date_completed,
                    mc.complete_status,
                    COUNT(*) OVER (PARTITION BY mc.mission_id) as total_times_completed
                FROM missions m
                INNER JOIN mission_completions mc ON m.mission_id = mc.mission_id
                WHERE mc.user_id = $1
                AND mc.complete_status = true
                ORDER BY mc.date_completed DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving completed missions:', err);
                    return callback(err, null);
                }

                callback(null, {
                    total_completed: results.rows.length,
                    missions: results.rows
                });
            });
        } catch (error) {
            console.error('Error in listCompletedMissions:', error);
            callback(error, null);
        }
    },

    // Get specific mission completion details
    getMissionCompletionDetails: (userId, missionId, callback) => {
        try {
            if (!userId || !missionId) {
                return callback(new Error('User ID and Mission ID are required'), null);
            }

            const query = `
                SELECT 
                    m.mission_id,
                    m.title as mission_name,
                    m.description,
                    m.reward_points,
                    mc.date_completed,
                    mc.complete_status,
                    (
                        SELECT COUNT(*) 
                        FROM mission_completions 
                        WHERE mission_id = $2 
                        AND user_id = $1 
                        AND complete_status = true
                    ) as completion_count
                FROM missions m
                INNER JOIN mission_completions mc ON m.mission_id = mc.mission_id
                WHERE m.mission_id = $2
                AND mc.user_id = $1
            `;

            db.query(query, [userId, missionId], (err, results) => {
                if (err) {
                    console.error('Error retrieving mission completion details:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Mission completion record not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getMissionCompletionDetails:', error);
            callback(error, null);
        }
    },

    // List all volunteer activities user has registered for
    listVolunteerActivities: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    v.volunteer_id,
                    v.title as activity_name,
                    v.description,
                    v.location,
                    vr.registration_date,
                    vr.status,
                    v.start_date,
                    v.end_date,
                    (SELECT COUNT(*) FROM volunteer_registrations WHERE volunteer_id = v.volunteer_id) as total_volunteers
                FROM volunteer_activities v
                INNER JOIN volunteer_registrations vr ON v.volunteer_id = vr.volunteer_id
                WHERE vr.user_id = $1
                ORDER BY vr.registration_date DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving volunteer activities:', err);
                    return callback(err, null);
                }

                callback(null, {
                    total_activities: results.rows.length,
                    activities: results.rows
                });
            });
        } catch (error) {
            console.error('Error in listVolunteerActivities:', error);
            callback(error, null);
        }
    },

    // Get specific volunteer activity details
    getVolunteerActivityDetails: (userId, volunteerId, callback) => {
        try {
            if (!userId || !volunteerId) {
                return callback(new Error('User ID and Volunteer Activity ID are required'), null);
            }

            const query = `
                SELECT 
                    v.volunteer_id,
                    v.title as activity_name,
                    v.description,
                    v.location,
                    v.start_date,
                    v.end_date,
                    vr.registration_date,
                    vr.status,
                    (SELECT COUNT(*) FROM volunteer_registrations WHERE volunteer_id = v.volunteer_id) as total_volunteers
                FROM volunteer_activities v
                INNER JOIN volunteer_registrations vr ON v.volunteer_id = vr.volunteer_id
                WHERE v.volunteer_id = $2
                AND vr.user_id = $1
            `;

            db.query(query, [userId, volunteerId], (err, results) => {
                if (err) {
                    console.error('Error retrieving volunteer activity details:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Volunteer activity registration not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getVolunteerActivityDetails:', error);
            callback(error, null);
        }
    },

    // List all friends user has made with friendship dates
    listUserFriends: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    CASE 
                        WHEN f.user_id_1 = $1 THEN f.user_id_2
                        ELSE f.user_id_1
                    END as friend_id,
                    u.name as friend_name,
                    u.age as friend_age,
                    u.email as friend_email,
                    f.created_at as friendship_date,
                    f.status as friendship_status
                FROM friendships f
                INNER JOIN users u ON (
                    (f.user_id_1 = $1 AND u.user_id = f.user_id_2) OR
                    (f.user_id_2 = $1 AND u.user_id = f.user_id_1)
                )
                WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1)
                AND f.status = 'accepted'
                ORDER BY f.created_at DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving friends list:', err);
                    return callback(err, null);
                }

                callback(null, {
                    total_friends: results.rows.length,
                    friends: results.rows
                });
            });
        } catch (error) {
            console.error('Error in listUserFriends:', error);
            callback(error, null);
        }
    },

    // Get specific friend details with friendship timeline
    getFriendshipDetails: (userId, friendId, callback) => {
        try {
            if (!userId || !friendId) {
                return callback(new Error('User ID and Friend ID are required'), null);
            }

            const query = `
                SELECT 
                    f.friendship_id,
                    CASE 
                        WHEN f.user_id_1 = $1 THEN f.user_id_2
                        ELSE f.user_id_1
                    END as friend_id,
                    u.name as friend_name,
                    u.age as friend_age,
                    u.email as friend_email,
                    f.created_at as friendship_date,
                    f.updated_at as last_interaction,
                    f.status as friendship_status
                FROM friendships f
                INNER JOIN users u ON (
                    (f.user_id_1 = $1 AND u.user_id = f.user_id_2) OR
                    (f.user_id_2 = $1 AND u.user_id = f.user_id_1)
                )
                WHERE (
                    (f.user_id_1 = $1 AND f.user_id_2 = $2) OR
                    (f.user_id_2 = $1 AND f.user_id_1 = $2)
                )
            `;

            db.query(query, [userId, friendId], (err, results) => {
                if (err) {
                    console.error('Error retrieving friendship details:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Friendship not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getFriendshipDetails:', error);
            callback(error, null);
        }
    },

    // Get comprehensive user activity log
    getUserActivityLog: (userId, callback) => {
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
                    u.created_at as onboarding_date,
                    (SELECT COUNT(*) FROM mission_completions WHERE user_id = $1 AND complete_status = true) as total_missions_completed,
                    (SELECT COUNT(*) FROM volunteer_registrations WHERE user_id = $1) as total_volunteer_activities,
                    (
                        SELECT COUNT(DISTINCT CASE WHEN user_id_1 = $1 THEN user_id_2 ELSE user_id_1 END)
                        FROM friendships 
                        WHERE (user_id_1 = $1 OR user_id_2 = $1) 
                        AND status = 'accepted'
                    ) as total_friends,
                    u.total_points
                FROM users u
                WHERE u.user_id = $1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving activity log:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('User not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getUserActivityLog:', error);
            callback(error, null);
        }
    }
};

module.exports = Log;
