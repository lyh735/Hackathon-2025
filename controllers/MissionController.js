const db = require('../db');
const Mission = require('../models/Mission');

// Helper function to check if user is admin
const isAdmin = (req) => {
    return req.session.user && req.session.user.role === 'admin';
};

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

        Mission.getAllMissions(userId, (err, missions) => {
            if (err) {
                console.error('Error retrieving missions:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving missions'
                });
            }

            res.status(200).json({
                success: true,
                data: missions,
                count: missions.length,
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

        Mission.getMissionById(missionId, userId, (err, mission) => {
            if (err) {
                console.error('Error retrieving mission:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: mission,
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

        Mission.completeMission(missionId, userId, (err, result) => {
            if (err) {
                console.error('Error completing mission:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: result,
                message: result.reward_points ? `Mission completed! You earned ${result.reward_points} points.` : 'Mission completed successfully!'
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

        Mission.getUserMissionHistory(userId, (err, history) => {
            if (err) {
                console.error('Error retrieving mission history:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving mission history'
                });
            }

            res.status(200).json({
                success: true,
                data: history,
                count: history.length,
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

// Create a new mission (admin only)
const createMission = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can create missions'
            });
        }

        const { title, description, reward_points, category, difficulty_level } = req.body;

        if (!title || !description || reward_points === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and reward points are required'
            });
        }

        if (isNaN(reward_points) || reward_points < 0) {
            return res.status(400).json({
                success: false,
                message: 'Reward points must be a non-negative number'
            });
        }

        const missionData = {
            title,
            description,
            reward_points: parseInt(reward_points),
            category: category || null,
            difficulty_level: difficulty_level || null
        };

        Mission.createMission(missionData, (err, mission) => {
            if (err) {
                console.error('Error creating mission:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                data: mission,
                message: 'Mission created successfully'
            });
        });
    } catch (error) {
        console.error('Error in createMission:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Update mission (admin only)
const updateMission = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update missions'
            });
        }

        const { missionId } = req.params;

        if (!missionId) {
            return res.status(400).json({
                success: false,
                message: 'Mission ID is required'
            });
        }

        const { title, description, reward_points, category, difficulty_level } = req.body;

        // Validate at least one field is provided
        if (!title && !description && reward_points === undefined && !category && !difficulty_level) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required to update'
            });
        }

        // Validate reward points if provided
        if (reward_points !== undefined && (isNaN(reward_points) || reward_points < 0)) {
            return res.status(400).json({
                success: false,
                message: 'Reward points must be a non-negative number'
            });
        }

        const missionData = {
            title,
            description,
            reward_points: reward_points !== undefined ? parseInt(reward_points) : undefined,
            category,
            difficulty_level
        };

        Mission.updateMission(missionId, missionData, (err, mission) => {
            if (err) {
                console.error('Error updating mission:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: mission,
                message: 'Mission updated successfully'
            });
        });
    } catch (error) {
        console.error('Error in updateMission:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Delete mission (admin only)
const deleteMission = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete missions'
            });
        }

        const { missionId } = req.params;

        if (!missionId) {
            return res.status(400).json({
                success: false,
                message: 'Mission ID is required'
            });
        }

        Mission.deleteMission(missionId, (err, result) => {
            if (err) {
                console.error('Error deleting mission:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'Mission deleted successfully'
            });
        });
    } catch (error) {
        console.error('Error in deleteMission:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// List all missions (admin view)
const listAllMissionsAdmin = (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can view all missions'
            });
        }

        Mission.getAllMissionsAdmin((err, missions) => {
            if (err) {
                console.error('Error retrieving missions:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving missions'
                });
            }

            res.status(200).json({
                success: true,
                data: missions,
                count: missions.length,
                message: 'All missions retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listAllMissionsAdmin:', error);
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
    getUserMissionHistory,
    createMission,
    updateMission,
    deleteMission,
    listAllMissionsAdmin
};
