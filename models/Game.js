const db = require('../db');

const Game = {
    // Get all games
    getAllGames: (callback) => {
        try {
            const query = `
                SELECT 
                    game_id,
                    title,
                    description,
                    genre,
                    difficulty_level,
                    reward_points,
                    image_url,
                    status,
                    created_at,
                    updated_at
                FROM games
                WHERE status = 'active'
                ORDER BY created_at DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Error retrieving all games:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getAllGames:', error);
            callback(error, null);
        }
    },

    // Get game by ID
    getGameById: (gameId, callback) => {
        try {
            if (!gameId) {
                return callback(new Error('Game ID is required'), null);
            }

            const query = `
                SELECT 
                    game_id,
                    title,
                    description,
                    genre,
                    difficulty_level,
                    reward_points,
                    image_url,
                    status,
                    created_at,
                    updated_at,
                    (SELECT COUNT(*) FROM game_completions WHERE game_id = $1) as total_completions,
                    (SELECT AVG(rating) FROM game_ratings WHERE game_id = $1) as average_rating
                FROM games
                WHERE game_id = $1
            `;

            db.query(query, [gameId], (err, results) => {
                if (err) {
                    console.error('Error retrieving game by ID:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Game not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getGameById:', error);
            callback(error, null);
        }
    },

    // Update game (admin only)
    updateGame: (gameId, gameData, callback) => {
        try {
            if (!gameId) {
                return callback(new Error('Game ID is required'), null);
            }

            const { title, description, genre, difficulty_level, reward_points, image_url, status } = gameData;

            // Check if game exists
            const checkQuery = `
                SELECT game_id FROM games WHERE game_id = $1
            `;

            db.query(checkQuery, [gameId], (err, checkResults) => {
                if (err) {
                    console.error('Error checking game existence:', err);
                    return callback(err, null);
                }

                if (checkResults.rows.length === 0) {
                    return callback(new Error('Game not found'), null);
                }

                // Build dynamic update query
                let query = 'UPDATE games SET ';
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

                if (genre !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `genre = $${paramCount}`;
                    params.push(genre);
                    paramCount++;
                }

                if (difficulty_level !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `difficulty_level = $${paramCount}`;
                    params.push(difficulty_level);
                    paramCount++;
                }

                if (reward_points !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `reward_points = $${paramCount}`;
                    params.push(reward_points);
                    paramCount++;
                }

                if (image_url !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `image_url = $${paramCount}`;
                    params.push(image_url);
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

                query += `, updated_at = NOW() WHERE game_id = $${paramCount} RETURNING game_id, title, description, genre, difficulty_level, reward_points, image_url, status, updated_at`;
                params.push(gameId);

                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Error updating game:', err);
                        return callback(err, null);
                    }

                    callback(null, results.rows[0]);
                });
            });
        } catch (error) {
            console.error('Error in updateGame:', error);
            callback(error, null);
        }
    },

    // Get game completion stats
    getGameStats: (gameId, callback) => {
        try {
            if (!gameId) {
                return callback(new Error('Game ID is required'), null);
            }

            const query = `
                SELECT 
                    g.game_id,
                    g.title,
                    (SELECT COUNT(*) FROM game_completions WHERE game_id = $1) as total_completions,
                    (SELECT COUNT(DISTINCT user_id) FROM game_completions WHERE game_id = $1) as unique_players,
                    (SELECT AVG(rating) FROM game_ratings WHERE game_id = $1) as average_rating,
                    (SELECT COUNT(*) FROM game_ratings WHERE game_id = $1) as total_ratings,
                    SUM(g.reward_points * (SELECT COUNT(*) FROM game_completions WHERE game_id = $1)) as total_rewards_distributed
                FROM games g
                WHERE g.game_id = $1
            `;

            db.query(query, [gameId], (err, results) => {
                if (err) {
                    console.error('Error retrieving game stats:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Game not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getGameStats:', error);
            callback(error, null);
        }
    },

    // Search games by title or genre
    searchGames: (searchTerm, callback) => {
        try {
            if (!searchTerm) {
                return callback(new Error('Search term is required'), null);
            }

            const query = `
                SELECT 
                    game_id,
                    title,
                    description,
                    genre,
                    difficulty_level,
                    reward_points,
                    image_url,
                    status,
                    created_at
                FROM games
                WHERE status = 'active'
                AND (LOWER(title) LIKE LOWER($1) OR LOWER(genre) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1))
                ORDER BY title ASC
            `;

            db.query(query, [`%${searchTerm}%`], (err, results) => {
                if (err) {
                    console.error('Error searching games:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in searchGames:', error);
            callback(error, null);
        }
    },

    // Get games by difficulty level
    getGamesByDifficulty: (difficulty, callback) => {
        try {
            if (!difficulty) {
                return callback(new Error('Difficulty level is required'), null);
            }

            const query = `
                SELECT 
                    game_id,
                    title,
                    description,
                    genre,
                    difficulty_level,
                    reward_points,
                    image_url,
                    status,
                    created_at
                FROM games
                WHERE status = 'active'
                AND LOWER(difficulty_level) = LOWER($1)
                ORDER BY created_at DESC
            `;

            db.query(query, [difficulty], (err, results) => {
                if (err) {
                    console.error('Error retrieving games by difficulty:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getGamesByDifficulty:', error);
            callback(error, null);
        }
    }
};

module.exports = Game;
