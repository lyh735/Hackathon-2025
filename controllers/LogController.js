const Log = require('../models/Log');

// Get user onboarding information
const getUserOnboardingInfo = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Log.getUserOnboardingDate(userId, (err, result) => {
            if (err) {
                console.error('Error retrieving onboarding info:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Onboarding information retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getUserOnboardingInfo:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// List all missions completed by user
const listCompletedMissions = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Log.listCompletedMissions(userId, (err, result) => {
            if (err) {
                console.error('Error retrieving completed missions:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Completed missions retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listCompletedMissions:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get specific mission completion details
const getMissionCompletionDetails = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { missionId } = req.params;

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

        Log.getMissionCompletionDetails(userId, missionId, (err, result) => {
            if (err) {
                console.error('Error retrieving mission details:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Mission completion details retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getMissionCompletionDetails:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// List all volunteer activities user has registered for
const listVolunteerActivities = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Log.listVolunteerActivities(userId, (err, result) => {
            if (err) {
                console.error('Error retrieving volunteer activities:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Volunteer activities retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listVolunteerActivities:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get specific volunteer activity details
const getVolunteerActivityDetails = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { volunteerId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!volunteerId) {
            return res.status(400).json({
                success: false,
                message: 'Volunteer Activity ID is required'
            });
        }

        Log.getVolunteerActivityDetails(userId, volunteerId, (err, result) => {
            if (err) {
                console.error('Error retrieving volunteer activity details:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Volunteer activity details retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getVolunteerActivityDetails:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// List all friends user has made
const listUserFriends = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Log.listUserFriends(userId, (err, result) => {
            if (err) {
                console.error('Error retrieving friends list:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Friends list retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listUserFriends:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get specific friendship details
const getFriendshipDetails = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { friendId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: 'Friend ID is required'
            });
        }

        Log.getFriendshipDetails(userId, friendId, (err, result) => {
            if (err) {
                console.error('Error retrieving friendship details:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Friendship details retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getFriendshipDetails:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display user's comprehensive activity log
const displayActivityLog = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).render('log', {
                message: 'Please log in to view your activity log'
            });
        }

        Log.getUserActivityLog(userId, (err, result) => {
            if (err) {
                console.error('Error retrieving activity log:', err.message);
                return res.status(404).render('log', {
                    message: 'User activity log not found'
                });
            }

            res.render('log', {
                activityLog: result,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayActivityLog:', error);
        res.status(500).render('log', {
            message: 'An unexpected error occurred'
        });
    }
};

// Get comprehensive user activity log as JSON
const getUserActivityLog = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        Log.getUserActivityLog(userId, (err, result) => {
            if (err) {
                console.error('Error retrieving activity log:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Activity log retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getUserActivityLog:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    getUserOnboardingInfo,
    listCompletedMissions,
    getMissionCompletionDetails,
    listVolunteerActivities,
    getVolunteerActivityDetails,
    listUserFriends,
    getFriendshipDetails,
    displayActivityLog,
    getUserActivityLog
};
