const Game = require('../models/Game');

// Helper function to check if user is admin
const isAdmin = (req) => {
    return req.session.user && req.session.user.role === 'admin';
};

// List all games for users
const listAllGames = (req, res) => {
    try {
        Game.getAllGames((err, games) => {
            if (err) {
                console.error('Error retrieving games:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving games'
                });
            }

            res.status(200).json({
                success: true,
                data: games,
                count: games.length,
                message: 'Games retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in listAllGames:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display all games view
const displayAllGames = (req, res) => {
    try {
        Game.getAllGames((err, games) => {
            if (err) {
                console.error('Error retrieving games:', err.message);
                return res.status(500).render('game', {
                    games: [],
                    message: 'Error retrieving games'
                });
            }

            res.render('game', {
                games: games,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayAllGames:', error);
        res.status(500).render('game', {
            games: [],
            message: 'An unexpected error occurred'
        });
    }
};

// Get game by ID
const getGameById = (req, res) => {
    try {
        const { gameId } = req.params;

        if (!gameId) {
            return res.status(400).json({
                success: false,
                message: 'Game ID is required'
            });
        }

        Game.getGameById(gameId, (err, game) => {
            if (err) {
                console.error('Error retrieving game:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: game,
                message: 'Game retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getGameById:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display game details view
const displayGameDetails = (req, res) => {
    try {
        const { gameId } = req.params;

        if (!gameId) {
            return res.status(400).render('game-details', {
                game: null,
                message: 'Game ID is required'
            });
        }

        Game.getGameById(gameId, (err, game) => {
            if (err) {
                console.error('Error retrieving game:', err.message);
                return res.status(404).render('game-details', {
                    game: null,
                    message: err.message
                });
            }

            res.render('game-details', {
                game: game,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in displayGameDetails:', error);
        res.status(500).render('game-details', {
            game: null,
            message: 'An unexpected error occurred'
        });
    }
};

// Update game (admin only)
const updateGame = (req, res) => {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update games'
            });
        }

        const { gameId } = req.params;

        if (!gameId) {
            return res.status(400).json({
                success: false,
                message: 'Game ID is required'
            });
        }

        const { title, description, genre, difficulty_level, reward_points, image_url, status } = req.body;

        // Validate at least one field is provided
        if (!title && !description && !genre && !difficulty_level && reward_points === undefined && !image_url && !status) {
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

        // Validate status if provided
        const validStatuses = ['active', 'inactive', 'archived'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: active, inactive, or archived'
            });
        }

        const gameData = {
            title,
            description,
            genre,
            difficulty_level,
            reward_points,
            image_url,
            status
        };

        Game.updateGame(gameId, gameData, (err, updatedGame) => {
            if (err) {
                console.error('Error updating game:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: updatedGame,
                message: 'Game updated successfully'
            });
        });
    } catch (error) {
        console.error('Error in updateGame:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get game statistics
const getGameStats = (req, res) => {
    try {
        const { gameId } = req.params;

        if (!gameId) {
            return res.status(400).json({
                success: false,
                message: 'Game ID is required'
            });
        }

        Game.getGameStats(gameId, (err, stats) => {
            if (err) {
                console.error('Error retrieving game stats:', err.message);
                return res.status(404).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: stats,
                message: 'Game statistics retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in getGameStats:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Search games
const searchGames = (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        Game.searchGames(query, (err, games) => {
            if (err) {
                console.error('Error searching games:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error searching games'
                });
            }

            res.status(200).json({
                success: true,
                data: games,
                count: games.length,
                message: 'Games search results retrieved successfully'
            });
        });
    } catch (error) {
        console.error('Error in searchGames:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Get games by difficulty level
const getGamesByDifficulty = (req, res) => {
    try {
        const { difficulty } = req.params;

        if (!difficulty) {
            return res.status(400).json({
                success: false,
                message: 'Difficulty level is required'
            });
        }

        Game.getGamesByDifficulty(difficulty, (err, games) => {
            if (err) {
                console.error('Error retrieving games by difficulty:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving games'
                });
            }

            res.status(200).json({
                success: true,
                data: games,
                count: games.length,
                message: `Games with difficulty level '${difficulty}' retrieved successfully`
            });
        });
    } catch (error) {
        console.error('Error in getGamesByDifficulty:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    listAllGames,
    displayAllGames,
    getGameById,
    displayGameDetails,
    updateGame,
    getGameStats,
    searchGames,
    getGamesByDifficulty
};
