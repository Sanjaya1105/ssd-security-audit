require("dotenv").config();

// ✅ Create new feedback (Auto-Increment `feedback_id`)
exports.createFeedback = async (req, res) => {
    try {
        console.log("🔹 Inside createFeedback function");
        console.log("🔹 Received user from token:", req.user);

        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized: Please login to submit feedback",
                error: "AUTH_REQUIRED"
            });
        }

        const { comment_, star_rating } = req.body;
        const user_id = req.user.user_id;
        const db = req.db;

        // Validate star rating
        if (star_rating < 1 || star_rating > 5) {
            return res.status(400).json({ 
                success: false,
                message: "Star rating must be between 1 and 5",
                error: "INVALID_RATING"
            });
        }

        // Validate comment length
        if (!comment_ || comment_.trim().length < 10) {
            return res.status(400).json({ 
                success: false,
                message: "Comment must be at least 10 characters long",
                error: "INVALID_COMMENT"
            });
        }

        // ✅ Insert feedback WITHOUT `feedback_id`
        db.execute(
            "INSERT INTO feedback (user_id, comment_, star_rating) VALUES (?, ?, ?)",
            [user_id, comment_.trim(), star_rating],
            (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ 
                        success: false,
                        message: "Server Error: Failed to submit feedback",
                        error: "DATABASE_ERROR"
                    });
                }

                res.status(201).json({ 
                    success: true,
                    message: "✅ Feedback submitted successfully", 
                    feedback_id: result.insertId 
                });
            }
        );
    } catch (error) {
        console.error("Create Feedback Error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server Error: An unexpected error occurred",
            error: "SERVER_ERROR"
        });
    }
};

// ✅ Get all feedback
exports.getAllFeedback = async (req, res) => {
    try {
        const db = req.db;
        db.execute(
            `SELECT f.*, u.first_name, u.last_name 
             FROM feedback f 
             JOIN user u ON f.user_id = u.user_id`,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Get feedback by ID
exports.getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.db;
        
        db.execute(
            `SELECT f.*, u.first_name, u.last_name 
             FROM feedback f 
             JOIN user u ON f.user_id = u.user_id 
             WHERE f.feedback_id = ?`,
            [id],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                
                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Feedback not found" });
                }
                
                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Get feedback by user ID
exports.getFeedbackByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const db = req.db;
        
        db.execute(
            `SELECT f.*, u.first_name, u.last_name 
             FROM feedback f 
             JOIN user u ON f.user_id = u.user_id 
             WHERE f.user_id = ?`,
            [userId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Update feedback
exports.updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment_, star_rating } = req.body;
        const db = req.db;

        // Validate star rating
        if (star_rating < 1 || star_rating > 5) {
            return res.status(400).json({ message: "Star rating must be between 1 and 5" });
        }

        // Check if feedback exists
        db.execute("SELECT * FROM feedback WHERE feedback_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ Feedback not found" });
            }

            // Update feedback
            db.execute(
                "UPDATE feedback SET comment_ = ?, star_rating = ? WHERE feedback_id = ?",
                [comment_, star_rating, id],
                (err, result) => {
                    if (err) return res.status(500).json({ message: "Server Error", error: err });
                    res.status(200).json({ message: "✅ Feedback updated successfully" });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Delete feedback
exports.deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.db;

        // 🔐 Role check: Only allow users with role 'admin' or 'user'
        const user = req.user;
        if (!user || (user.role !== 'admin' && user.role !== 'user')) {
            return res.status(403).json({ message: "⛔ Unauthorized: Only users and admins can delete feedback" });
        }

        // ✅ Check if feedback exists
        db.execute("SELECT * FROM feedback WHERE feedback_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ Feedback not found" });
            }

            // 🗑️ Delete feedback
            db.execute(
                "DELETE FROM feedback WHERE feedback_id = ?",
                [id],
                (err, result) => {
                    if (err) return res.status(500).json({ message: "Server Error", error: err });
                    res.status(200).json({ message: "✅ Feedback deleted successfully" });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};


// ✅ Get all 5-star rated feedback
exports.getFiveStarFeedback = async (req, res) => {
    try {
        const db = req.db;
        db.execute(
            `SELECT f.*, u.first_name, u.last_name 
             FROM feedback f 
             JOIN user u ON f.user_id = u.user_id 
             WHERE f.star_rating = 5
             ORDER BY f.feedback_id DESC`,
            (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ 
                        success: false,
                        message: "Server Error: Failed to fetch feedback",
                        error: "DATABASE_ERROR"
                    });
                }
                res.status(200).json({
                    success: true,
                    message: "✅ Five star feedback fetched successfully",
                    data: results
                });
            }
        );
    } catch (error) {
        console.error("Get Five Star Feedback Error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server Error: An unexpected error occurred",
            error: "SERVER_ERROR"
        });
    }
};

// ✅ Get latest 5 feedback entries
exports.getLatestFeedback = async (req, res) => {
    try {
        const db = req.db;
        db.execute(
            `SELECT f.*, u.first_name, u.last_name 
             FROM feedback f 
             JOIN user u ON f.user_id = u.user_id 
             ORDER BY f.feedback_id DESC 
             LIMIT 5`,
            (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ 
                        success: false,
                        message: "Server Error: Failed to fetch feedback",
                        error: "DATABASE_ERROR"
                    });
                }
                res.status(200).json({
                    success: true,
                    message: "✅ Latest feedback fetched successfully",
                    data: results
                });
            }
        );
    } catch (error) {
        console.error("Get Latest Feedback Error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server Error: An unexpected error occurred",
            error: "SERVER_ERROR"
        });
    }
}; 