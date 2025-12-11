const db = require('../db');

const Quiz = {
    // Get all quizzes
    getAllQuizzes: (callback) => {
        try {
            const query = `
                SELECT 
                    quiz_id,
                    title,
                    description,
                    category,
                    difficulty_level,
                    reward_points,
                    time_limit,
                    passing_score,
                    status,
                    created_at,
                    updated_at,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = quizzes.quiz_id) as question_count
                FROM quizzes
                WHERE status = 'active'
                ORDER BY created_at DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Error retrieving all quizzes:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getAllQuizzes:', error);
            callback(error, null);
        }
    },

    // Get quiz by ID with questions
    getQuizById: (quizId, callback) => {
        try {
            if (!quizId) {
                return callback(new Error('Quiz ID is required'), null);
            }

            const query = `
                SELECT 
                    quiz_id,
                    title,
                    description,
                    category,
                    difficulty_level,
                    reward_points,
                    time_limit,
                    passing_score,
                    status,
                    created_at,
                    updated_at,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1) as question_count
                FROM quizzes
                WHERE quiz_id = $1
            `;

            db.query(query, [quizId], (err, results) => {
                if (err) {
                    console.error('Error retrieving quiz by ID:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Quiz not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getQuizById:', error);
            callback(error, null);
        }
    },

    // Get quiz questions
    getQuizQuestions: (quizId, callback) => {
        try {
            if (!quizId) {
                return callback(new Error('Quiz ID is required'), null);
            }

            const query = `
                SELECT 
                    question_id,
                    quiz_id,
                    question_text,
                    question_type,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_answer
                FROM quiz_questions
                WHERE quiz_id = $1
                ORDER BY question_id ASC
            `;

            db.query(query, [quizId], (err, results) => {
                if (err) {
                    console.error('Error retrieving quiz questions:', err);
                    return callback(err, null);
                }

                callback(null, results.rows);
            });
        } catch (error) {
            console.error('Error in getQuizQuestions:', error);
            callback(error, null);
        }
    },

    // Submit quiz answers and calculate score
    submitQuizAnswers: (userId, quizId, answers, callback) => {
        try {
            if (!userId || !quizId || !answers) {
                return callback(new Error('User ID, Quiz ID, and answers are required'), null);
            }

            // Get quiz questions to verify answers
            const questionsQuery = `
                SELECT question_id, correct_answer
                FROM quiz_questions
                WHERE quiz_id = $1
            `;

            db.query(questionsQuery, [quizId], (err, questionsResults) => {
                if (err) {
                    console.error('Error retrieving quiz questions:', err);
                    return callback(err, null);
                }

                // Calculate score
                let correctCount = 0;
                const totalQuestions = questionsResults.rows.length;

                questionsResults.rows.forEach((question) => {
                    const userAnswer = answers[question.question_id];
                    if (userAnswer === question.correct_answer) {
                        correctCount++;
                    }
                });

                const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

                // Get quiz info
                const quizInfoQuery = `
                    SELECT reward_points, passing_score
                    FROM quizzes
                    WHERE quiz_id = $1
                `;

                db.query(quizInfoQuery, [quizId], (err, quizResults) => {
                    if (err) {
                        console.error('Error retrieving quiz info:', err);
                        return callback(err, null);
                    }

                    if (quizResults.rows.length === 0) {
                        return callback(new Error('Quiz not found'), null);
                    }

                    const quiz = quizResults.rows[0];
                    const passed = score >= quiz.passing_score;
                    const rewardPoints = passed ? quiz.reward_points : 0;

                    // Store quiz result
                    const insertQuery = `
                        INSERT INTO quiz_results (user_id, quiz_id, score, passed, reward_earned, submitted_at)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        RETURNING result_id, user_id, quiz_id, score, passed, reward_earned, submitted_at
                    `;

                    db.query(insertQuery, [userId, quizId, score, passed, rewardPoints], (err, insertResults) => {
                        if (err) {
                            console.error('Error storing quiz result:', err);
                            return callback(err, null);
                        }

                        // Update user points if passed
                        if (passed && rewardPoints > 0) {
                            const updatePointsQuery = `
                                UPDATE users
                                SET total_points = total_points + $1
                                WHERE user_id = $2
                            `;

                            db.query(updatePointsQuery, [rewardPoints, userId], (err) => {
                                if (err) {
                                    console.error('Error updating user points:', err);
                                    return callback(err, null);
                                }

                                callback(null, {
                                    result_id: insertResults.rows[0].result_id,
                                    score: score,
                                    passed: passed,
                                    reward_earned: rewardPoints,
                                    total_questions: totalQuestions,
                                    correct_answers: correctCount
                                });
                            });
                        } else {
                            callback(null, {
                                result_id: insertResults.rows[0].result_id,
                                score: score,
                                passed: passed,
                                reward_earned: 0,
                                total_questions: totalQuestions,
                                correct_answers: correctCount
                            });
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Error in submitQuizAnswers:', error);
            callback(error, null);
        }
    },

    // Get user's quiz result
    getUserQuizResult: (userId, quizId, callback) => {
        try {
            if (!userId || !quizId) {
                return callback(new Error('User ID and Quiz ID are required'), null);
            }

            const query = `
                SELECT 
                    result_id,
                    user_id,
                    quiz_id,
                    score,
                    passed,
                    reward_earned,
                    submitted_at
                FROM quiz_results
                WHERE user_id = $1 AND quiz_id = $2
                ORDER BY submitted_at DESC
                LIMIT 1
            `;

            db.query(query, [userId, quizId], (err, results) => {
                if (err) {
                    console.error('Error retrieving user quiz result:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Quiz result not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getUserQuizResult:', error);
            callback(error, null);
        }
    },

    // Get all results for a specific quiz (admin)
    getQuizResults: (quizId, callback) => {
        try {
            if (!quizId) {
                return callback(new Error('Quiz ID is required'), null);
            }

            const query = `
                SELECT 
                    qr.result_id,
                    qr.user_id,
                    u.name as user_name,
                    u.email,
                    qr.quiz_id,
                    q.title as quiz_title,
                    qr.score,
                    qr.passed,
                    qr.reward_earned,
                    qr.submitted_at
                FROM quiz_results qr
                INNER JOIN users u ON qr.user_id = u.user_id
                INNER JOIN quizzes q ON qr.quiz_id = q.quiz_id
                WHERE qr.quiz_id = $1
                ORDER BY qr.submitted_at DESC
            `;

            db.query(query, [quizId], (err, results) => {
                if (err) {
                    console.error('Error retrieving quiz results:', err);
                    return callback(err, null);
                }

                callback(null, {
                    total_results: results.rows.length,
                    results: results.rows
                });
            });
        } catch (error) {
            console.error('Error in getQuizResults:', error);
            callback(error, null);
        }
    },

    // Get user's quiz results history
    getUserQuizHistory: (userId, callback) => {
        try {
            if (!userId) {
                return callback(new Error('User ID is required'), null);
            }

            const query = `
                SELECT 
                    qr.result_id,
                    qr.quiz_id,
                    q.title as quiz_title,
                    q.category,
                    qr.score,
                    qr.passed,
                    qr.reward_earned,
                    qr.submitted_at,
                    q.passing_score
                FROM quiz_results qr
                INNER JOIN quizzes q ON qr.quiz_id = q.quiz_id
                WHERE qr.user_id = $1
                ORDER BY qr.submitted_at DESC
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error('Error retrieving user quiz history:', err);
                    return callback(err, null);
                }

                callback(null, {
                    total_quizzes_attempted: results.rows.length,
                    history: results.rows
                });
            });
        } catch (error) {
            console.error('Error in getUserQuizHistory:', error);
            callback(error, null);
        }
    },

    // Update quiz (admin only)
    updateQuiz: (quizId, quizData, callback) => {
        try {
            if (!quizId) {
                return callback(new Error('Quiz ID is required'), null);
            }

            const { title, description, category, difficulty_level, reward_points, time_limit, passing_score, status } = quizData;

            // Check if quiz exists
            const checkQuery = `
                SELECT quiz_id FROM quizzes WHERE quiz_id = $1
            `;

            db.query(checkQuery, [quizId], (err, checkResults) => {
                if (err) {
                    console.error('Error checking quiz existence:', err);
                    return callback(err, null);
                }

                if (checkResults.rows.length === 0) {
                    return callback(new Error('Quiz not found'), null);
                }

                // Build dynamic update query
                let query = 'UPDATE quizzes SET ';
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

                if (reward_points !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `reward_points = $${paramCount}`;
                    params.push(reward_points);
                    paramCount++;
                }

                if (time_limit !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `time_limit = $${paramCount}`;
                    params.push(time_limit);
                    paramCount++;
                }

                if (passing_score !== undefined) {
                    if (params.length > 0) query += ', ';
                    query += `passing_score = $${paramCount}`;
                    params.push(passing_score);
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

                query += `, updated_at = NOW() WHERE quiz_id = $${paramCount} RETURNING quiz_id, title, description, category, difficulty_level, reward_points, time_limit, passing_score, status, updated_at`;
                params.push(quizId);

                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Error updating quiz:', err);
                        return callback(err, null);
                    }

                    callback(null, results.rows[0]);
                });
            });
        } catch (error) {
            console.error('Error in updateQuiz:', error);
            callback(error, null);
        }
    },

    // Get quiz statistics (admin)
    getQuizStats: (quizId, callback) => {
        try {
            if (!quizId) {
                return callback(new Error('Quiz ID is required'), null);
            }

            const query = `
                SELECT 
                    q.quiz_id,
                    q.title,
                    (SELECT COUNT(*) FROM quiz_results WHERE quiz_id = $1) as total_attempts,
                    (SELECT COUNT(DISTINCT user_id) FROM quiz_results WHERE quiz_id = $1) as unique_users,
                    (SELECT COUNT(*) FROM quiz_results WHERE quiz_id = $1 AND passed = true) as passed_count,
                    (SELECT AVG(score) FROM quiz_results WHERE quiz_id = $1) as average_score,
                    (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1) as question_count
                FROM quizzes q
                WHERE q.quiz_id = $1
            `;

            db.query(query, [quizId], (err, results) => {
                if (err) {
                    console.error('Error retrieving quiz stats:', err);
                    return callback(err, null);
                }

                if (results.rows.length === 0) {
                    return callback(new Error('Quiz not found'), null);
                }

                callback(null, results.rows[0]);
            });
        } catch (error) {
            console.error('Error in getQuizStats:', error);
            callback(error, null);
        }
    }
};

module.exports = Quiz;
