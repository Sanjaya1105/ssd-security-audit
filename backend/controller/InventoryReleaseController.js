require("dotenv").config();

// Create new inventory release
exports.createInventoryRelease = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create inventory releases" });
        }

        const { order_id, item_id, quantity, date_time, status = 'pending' } = req.body;
        const db = req.db;

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than 0" });
        }

        // Check if order exists (if order_id is provided)
        if (order_id) {
            const [order] = await db.promise().execute(
                "SELECT * FROM orders WHERE order_id = ?",
                [order_id]
            );

            if (order.length === 0) {
                return res.status(404).json({ message: "❌ Order not found" });
            }
        }

        // Check if inventory item exists
        const [item] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
            [item_id]
        );

        if (item.length === 0) {
            return res.status(404).json({ message: "❌ Inventory item not found" });
        }

        // Format datetime for MySQL
        let formattedDateTime;
        if (date_time) {
            // Convert ISO string to MySQL datetime format
            const date = new Date(date_time);
            formattedDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
        } else {
            formattedDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        // Create inventory release with pending status by default
        const [result] = await db.promise().execute(
            `INSERT INTO inventory_release (
                order_id, item_id, quantity, date_time, status
            ) VALUES (?, ?, ?, ?, ?)`,
            [order_id, item_id, quantity, formattedDateTime, status]
        );

        res.status(201).json({
            message: "✅ Inventory release created successfully",
            release_id: result.insertId
        });
    } catch (error) {
        console.error("Create Inventory Release Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all inventory releases
exports.getAllInventoryReleases = async (req, res) => {
    try {
        const db = req.db;
        db.execute(
            `SELECT 
                ir.*,
                o.order_type,
                o.order_status,
                o.total_amount,
                ii.item_name,
                ii.category,
                ii.unit
             FROM inventory_release ir
             LEFT JOIN orders o ON ir.order_id = o.order_id
             LEFT JOIN inventory_item ii ON ir.item_id = ii.item_id
             ORDER BY ir.date_time DESC`,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get inventory release by ID
exports.getInventoryReleaseById = async (req, res) => {
    try {
        const { releaseId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT 
                ir.*,
                o.order_type,
                o.order_status,
                o.total_amount,
                ii.item_name,
                ii.category,
                ii.unit
             FROM inventory_release ir
             LEFT JOIN orders o ON ir.order_id = o.order_id
             LEFT JOIN inventory_item ii ON ir.item_id = ii.item_id
             WHERE ir.release_id = ?`,
            [releaseId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Inventory release not found" });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get inventory releases by order ID
exports.getInventoryReleasesByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT 
                ir.*,
                ii.item_name,
                ii.category,
                ii.unit
             FROM inventory_release ir
             LEFT JOIN inventory_item ii ON ir.item_id = ii.item_id
             WHERE ir.order_id = ?
             ORDER BY ir.date_time DESC`,
            [orderId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Update inventory release
exports.updateInventoryRelease = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can update inventory releases" });
        }

        const { releaseId } = req.params;
        const { order_id, item_id, quantity, date_time, status = 'pending' } = req.body;
        const db = req.db;

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than 0" });
        }

        // Validate status
        const validStatuses = ['pending', 'released', 'not released'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: "Invalid status value",
                valid_values: validStatuses
            });
        }

        // Check if inventory release exists
        const [existingRelease] = await db.promise().execute(
            "SELECT * FROM inventory_release WHERE release_id = ?",
            [releaseId]
        );

        if (existingRelease.length === 0) {
            return res.status(404).json({ message: "❌ Inventory release not found" });
        }

        // Check if order exists (if order_id is provided)
        if (order_id) {
            const [order] = await db.promise().execute(
                "SELECT * FROM orders WHERE order_id = ?",
                [order_id]
            );

            if (order.length === 0) {
                return res.status(404).json({ message: "❌ Order not found" });
            }
        }

        // Check if inventory item exists
        const [item] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
            [item_id]
        );

        if (item.length === 0) {
            return res.status(404).json({ message: "❌ Inventory item not found" });
        }

        // Format datetime for MySQL
        let formattedDateTime;
        if (date_time) {
            // Convert ISO string to MySQL datetime format
            const date = new Date(date_time);
            formattedDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
        } else {
            formattedDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        // Update inventory release
        await db.promise().execute(
            `UPDATE inventory_release 
             SET order_id = ?, item_id = ?, quantity = ?, date_time = ?, status = ?
             WHERE release_id = ?`,
            [order_id, item_id, quantity, formattedDateTime, status, releaseId]
        );

        res.status(200).json({ message: "✅ Inventory release updated successfully" });
    } catch (error) {
        console.error("Update Inventory Release Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete inventory release
exports.deleteInventoryRelease = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can delete inventory releases" });
        }

        const { releaseId } = req.params;
        const db = req.db;

        // Check if inventory release exists
        const [existingRelease] = await db.promise().execute(
            "SELECT * FROM inventory_release WHERE release_id = ?",
            [releaseId]
        );

        if (existingRelease.length === 0) {
            return res.status(404).json({ message: "❌ Inventory release not found" });
        }

        // Delete inventory release
        await db.promise().execute(
            "DELETE FROM inventory_release WHERE release_id = ?",
            [releaseId]
        );

        res.status(200).json({ message: "✅ Inventory release deleted successfully" });
    } catch (error) {
        console.error("Delete Inventory Release Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}; 