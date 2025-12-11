const db = require('../db');
const bcrypt = require('bcryptjs');

const User = {
    // Register a new user
    registerUser: (userData, callback) => {
        try {
            const { name, email, password, age } = userData;

            // Validate required fields
            if (!name || !email || !password || !age) {
                return callback(new Error('Name, email, password, and age are required'), null);
            }

            // Validate age
            if (isNaN(age) || age < 13) {
                return callback(new Error('Age must be at least 13 years old'), null);
            }

            // Check if user already exists
            const checkUserQuery = `
                SELECT user_id 
                FROM users 
                WHERE email = $1
            `;

            db.query(checkUserQuery, [email], (err, results) => {
                if (err) {
                    console.error('Error checking user existence:', err);
                    return callback(err, null);
                }

                if (results.rows.length > 0) {
                    return callback(new Error('User with this email already exists'), null);
                }

                // Hash password
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        return callback(err, null);
                    }

                    // Insert new user
                    const insertUserQuery = `
                        INSERT INTO users (name, email, password, age, total_points, created_at)
                        VALUES ($1, $2, $3, $4, 0, NOW())
                        RETURNING user_id, name, email, age, total_points
                    `;

                    db.query(insertUserQuery, [name, email, hashedPassword, age], (err, result) => {
                        if (err) {
                            console.error('Error registering user:', err);
                            return callback(err, null);
                        }

                        callback(null, {
                            user_id: result.rows[0].user_id,
                            name: result.rows[0].name,
                            email: result.rows[0].email,
                            age: result.rows[0].age,
                            total_points: result.rows[0].total_points,
                            message: 'User registered successfully'
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error in registerUser:', error);
            callback(error, null);
        }
    },

    // Login user and verify credentials
    loginUser: (email, password, callback) => {
        try {
            if (!email || !password) {
                return callback(new Error('Email and password are required'), null);
            }

            const query = `
                SELECT user_id, name, email, password, age, total_points
                FROM users
                WHERE email = $1
            `;

            db.query(query, [email], (err, results) => {
                if (err) {
                    console.error('Error retrieving user:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Invalid email or password'), null);
                }

                const user = results.rows[0];

                // Compare passwords
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        return callback(err, null);
                    }

                    if (!isMatch) {
                        return callback(new Error('Invalid email or password'), null);
                    }

                    // Return user data without password
                    callback(null, {
                        user_id: user.user_id,
                        name: user.name,
                        email: user.email,
                        age: user.age,
                        total_points: user.total_points
                    });
                });
            });
        } catch (error) {
            console.error('Error in loginUser:', error);
            callback(error, null);
        }
    },

    // Get user by ID
    getUserById: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT user_id, name, email, age, total_points, created_at
                FROM users
                WHERE user_id = $1
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving user:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('User not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getUserById:', error);
            callback(error, null);
        }
    },

    // Update user profile
    updateUserProfile: (userId, updateData, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const { name, age } = updateData;

            // Validate age if provided
            if (age && (isNaN(age) || age < 13)) {
                return callback(new Error('Age must be at least 13 years old'), null);
            }

            let query = 'UPDATE users SET ';
            let params = [];
            let paramCount = 1;

            if (name) {
                query += `name = $${paramCount}`;
                params.push(name);
                paramCount++;
            }

            if (age) {
                if (params.length > 0) query += ', ';
                query += `age = $${paramCount}`;
                params.push(age);
                paramCount++;
            }

            if (params.length === 0) {
                return callback(new Error('No fields to update'), null);
            }

            query += `, updated_at = NOW() WHERE user_id = $${paramCount} RETURNING user_id, name, email, age, total_points`;
            params.push(userId);

            db.query(query, params, (err, results) => {
                if (err) {
                    console.error('Error updating user profile:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('User not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in updateUserProfile:', error);
            callback(error, null);
        }
    },

    // Delete user account
    deleteUserAccount: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                DELETE FROM users 
                WHERE user_id = $1
                RETURNING user_id
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error deleting user account:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('User not found'), null);
                }

                callback(null, { message: 'User account deleted successfully' });
            });
        } catch (error) {
            console.error('Error in deleteUserAccount:', error);
            callback(error, null);
        }
    }
};

module.exports = User;
