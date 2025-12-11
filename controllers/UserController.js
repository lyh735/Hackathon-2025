const User = require('../models/User');

// Display registration form
const showRegister = (req, res) => {
    try {
        res.render('register', {
            message: null
        });
    } catch (error) {
        console.error('Error in showRegister:', error);
        res.status(500).render('register', {
            message: 'An error occurred'
        });
    }
};

// Handle user registration
const registerUser = (req, res) => {
    try {
        const { name, email, password, passwordConfirm, age } = req.body;

        // Basic validation
        if (!name || !email || !password || !passwordConfirm || !age) {
            return res.status(400).render('register', {
                message: 'Name, email, password, and age are required'
            });
        }

        // Validate age
        if (isNaN(age) || age < 13) {
            return res.status(400).render('register', {
                message: 'Age must be at least 13 years old'
            });
        }

        // Validate email format
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).render('register', {
                message: 'Please provide a valid email address'
            });
        }

        // Check password match
        if (password !== passwordConfirm) {
            return res.status(400).render('register', {
                message: 'Passwords do not match'
            });
        }

        // Check password length
        if (password.length < 8) {
            return res.status(400).render('register', {
                message: 'Password must be at least 8 characters long'
            });
        }

        // Call User model to register
        User.registerUser({ name, email, password, age }, (err, user) => {
            if (err) {
                console.error('Registration error:', err.message);
                return res.status(400).render('register', {
                    message: err.message
                });
            }

            return res.status(201).render('register', {
                message: 'User registered successfully! You can now log in.'
            });
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).render('register', {
            message: 'An unexpected error occurred'
        });
    }
};

// Display login form
const showLogin = (req, res) => {
    try {
        res.render('login', {
            message: null
        });
    } catch (error) {
        console.error('Error in showLogin:', error);
        res.status(500).render('login', {
            message: 'An error occurred'
        });
    }
};

// Handle user login
const loginUser = (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).render('login', {
                message: 'Email and password are required'
            });
        }

        // Call User model to login
        User.loginUser(email, password, (err, user) => {
            if (err) {
                console.error('Login error:', err.message);
                return res.status(401).render('login', {
                    message: err.message
                });
            }

            // Store user information in session
            req.session.user = {
                id: user.user_id,
                name: user.name,
                email: user.email,
                age: user.age,
                totalPoints: user.total_points
            };

            return res.status(200).redirect('/dashboard');
        });
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).render('login', {
            message: 'An unexpected error occurred'
        });
    }
};

// Handle user logout
const logoutUser = (req, res) => {
    try {
        req.session.user = null;
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error logging out'
                });
            }

            res.clearCookie('connect.sid');
            return res.status(200).redirect('/');
        });
    } catch (error) {
        console.error('Error in logoutUser:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Display user profile
const showProfile = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).render('login', {
                message: 'Please log in to view your profile'
            });
        }

        User.getUserById(userId, (err, user) => {
            if (err) {
                console.error('Error retrieving user:', err.message);
                return res.status(404).render('profile', {
                    message: 'User not found'
                });
            }

            res.render('profile', {
                user: user,
                message: null
            });
        });
    } catch (error) {
        console.error('Error in showProfile:', error);
        res.status(500).render('profile', {
            message: 'An unexpected error occurred'
        });
    }
};

// Update user profile
const updateProfile = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const { name, age } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Validate age if provided
        if (age && (isNaN(age) || age < 13)) {
            return res.status(400).json({
                success: false,
                message: 'Age must be at least 13 years old'
            });
        }

        User.updateUserProfile(userId, { name, age }, (err, updatedUser) => {
            if (err) {
                console.error('Error updating profile:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            // Update session with new user data
            req.session.user.name = updatedUser.name;
            req.session.user.age = updatedUser.age;

            return res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully'
            });
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

// Delete user account
const deleteAccount = (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        User.deleteUserAccount(userId, (err, result) => {
            if (err) {
                console.error('Error deleting account:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            // Destroy session
            req.session.user = null;
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }

                res.clearCookie('connect.sid');
                return res.status(200).json({
                    success: true,
                    message: 'Account deleted successfully'
                });
            });
        });
    } catch (error) {
        console.error('Error in deleteAccount:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

module.exports = {
    showRegister,
    registerUser,
    showLogin,
    loginUser,
    logoutUser,
    showProfile,
    updateProfile,
    deleteAccount
};
