require("dotenv").config();

// Create new production log entry
exports.createProductionLog = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create production logs" });
        }

        const { product_id, inventory_release_id, planned_quantity, actual_quantity, notes } = req.body;
        const db = req.db;

        // Validate quantities
        if (planned_quantity <= 0 || actual_quantity <= 0) {
            return res.status(400).json({ message: "Quantities must be greater than 0" });
        }

        if (actual_quantity > planned_quantity) {
            return res.status(400).json({ message: "Actual quantity cannot be greater than planned quantity" });
        }

        // Check if product exists
        const [product] = await db.promise().execute(
            "SELECT * FROM product WHERE product_id = ?",
            [product_id]
        );

        if (product.length === 0) {
            return res.status(404).json({ message: "❌ Product not found" });
        }

        // Check if inventory release exists
        const [inventoryRelease] = await db.promise().execute(
            "SELECT * FROM inventory_release WHERE release_id = ?",
            [inventory_release_id]
        );

        if (inventoryRelease.length === 0) {
            return res.status(404).json({ message: "❌ Inventory release not found" });
        }

        // Create production log entry
        const [result] = await db.promise().execute(
            `INSERT INTO production_log (
                product_id, inventory_release_id, planned_quantity,
                actual_quantity, date_time, notes
            ) VALUES (?, ?, ?, ?, NOW(), ?)`,
            [product_id, inventory_release_id, planned_quantity, actual_quantity, notes]
        );

        // The trigger will automatically update the product_stock table

        res.status(201).json({
            message: "✅ Production log created successfully",
            production_id: result.insertId
        });
    } catch (error) {
        console.error("Create Production Log Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all production logs
exports.getAllProductionLogs = async (req, res) => {
    try {
        const db = req.db;
        db.execute(
            `SELECT pl.*, p.product_name, ir.release_id, ps.quantity_available as current_stock
             FROM production_log pl
             LEFT JOIN product p ON pl.product_id = p.product_id
             LEFT JOIN inventory_release ir ON pl.inventory_release_id = ir.release_id
             LEFT JOIN product_stock ps ON pl.product_id = ps.product_id
             ORDER BY pl.date_time DESC`,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get production log by ID
exports.getProductionLogById = async (req, res) => {
    try {
        const { productionId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT pl.*, p.product_name, ir.release_id, ps.quantity_available as current_stock
             FROM production_log pl
             LEFT JOIN product p ON pl.product_id = p.product_id
             LEFT JOIN inventory_release ir ON pl.inventory_release_id = ir.release_id
             LEFT JOIN product_stock ps ON pl.product_id = ps.product_id
             WHERE pl.production_id = ?`,
            [productionId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Production log not found" });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get production logs by product ID
exports.getProductionLogsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const db = req.db;

        // Check if product exists
        const [product] = await db.promise().execute(
            "SELECT * FROM product WHERE product_id = ?",
            [productId]
        );

        if (product.length === 0) {
            return res.status(404).json({ message: "❌ Product not found" });
        }

        db.execute(
            `SELECT pl.*, p.product_name, ir.release_id, ps.quantity_available as current_stock
             FROM production_log pl
             LEFT JOIN product p ON pl.product_id = p.product_id
             LEFT JOIN inventory_release ir ON pl.inventory_release_id = ir.release_id
             LEFT JOIN product_stock ps ON pl.product_id = ps.product_id
             WHERE pl.product_id = ?
             ORDER BY pl.date_time DESC`,
            [productId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get production logs by inventory release ID
exports.getProductionLogsByInventoryRelease = async (req, res) => {
    try {
        const { inventoryReleaseId } = req.params;
        const db = req.db;

        // Check if inventory release exists
        const [inventoryRelease] = await db.promise().execute(
            "SELECT * FROM inventory_release WHERE release_id = ?",
            [inventoryReleaseId]
        );

        if (inventoryRelease.length === 0) {
            return res.status(404).json({ message: "❌ Inventory release not found" });
        }

        db.execute(
            `SELECT pl.*, p.product_name, ir.release_id, ps.quantity_available as current_stock
             FROM production_log pl
             LEFT JOIN product p ON pl.product_id = p.product_id
             LEFT JOIN inventory_release ir ON pl.inventory_release_id = ir.release_id
             LEFT JOIN product_stock ps ON pl.product_id = ps.product_id
             WHERE pl.inventory_release_id = ?
             ORDER BY pl.date_time DESC`,
            [inventoryReleaseId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get current stock for a product
exports.getProductStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const db = req.db;

        // Check if product exists
        const [product] = await db.promise().execute(
            "SELECT * FROM product WHERE product_id = ?",
            [productId]
        );

        if (product.length === 0) {
            return res.status(404).json({ message: "❌ Product not found" });
        }

        db.execute(
            `SELECT ps.*, p.product_name
             FROM product_stock ps
             LEFT JOIN product p ON ps.product_id = p.product_id
             WHERE ps.product_id = ?`,
            [productId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(200).json({
                        product_id: productId,
                        product_name: product[0].product_name,
                        quantity_available: 0,
                        last_updated: null
                    });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
}; 