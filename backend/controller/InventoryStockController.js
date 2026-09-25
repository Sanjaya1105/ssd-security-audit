require("dotenv").config();

// Create new stock entry (Manager and Admin only)
exports.createStock = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create stock entries" });
        }

        const {
            purchase_id,
            item_id,
            quantity_available
        } = req.body;

        const db = req.db;

        // Validate quantity
        if (quantity_available < 0) {
            return res.status(400).json({ message: "Quantity cannot be negative" });
        }

        // Check if purchase exists and get its details
        const [purchase] = await db.promise().execute(
            "SELECT * FROM purchase WHERE purchase_id = ?",
            [purchase_id]
        );

        if (purchase.length === 0) {
            return res.status(404).json({ message: "❌ Purchase record not found" });
        }

        // Check if item exists
        const [item] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
            [item_id]
        );

        if (item.length === 0) {
            return res.status(404).json({ message: "❌ Item not found" });
        }

        // Check if item_id matches the purchase's item_id
        if (purchase[0].item_id !== item_id) {
            return res.status(400).json({ 
                message: "❌ Item ID does not match the purchase record's item" 
            });
        }

        // Check if quantity_available doesn't exceed purchase's useful_quantity
        const [existingStock] = await db.promise().execute(
            "SELECT COALESCE(SUM(quantity_available), 0) as total_stock FROM inventory_stock WHERE purchase_id = ?",
            [purchase_id]
        );

        const totalExistingStock = existingStock[0].total_stock;
        const remainingQuantity = purchase[0].useful_quantity - totalExistingStock;

        if (quantity_available > remainingQuantity) {
            return res.status(400).json({ 
                message: "❌ Quantity exceeds remaining useful quantity from purchase",
                remaining_quantity: remainingQuantity
            });
        }

        // Create stock entry
        const [result] = await db.promise().execute(
            "INSERT INTO inventory_stock (purchase_id, item_id, quantity_available) VALUES (?, ?, ?)",
            [purchase_id, item_id, quantity_available]
        );

        res.status(201).json({
            message: "✅ Stock entry created successfully",
            stock_id: result.insertId
        });
    } catch (error) {
        console.error("Create Stock Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all stock entries
exports.getAllStock = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const db = req.db;
        db.execute(
            `SELECT 
                s.*,
                i.item_name,
                i.brand,
                i.category,
                i.unit,
                p.purchase_date,
                p.buying_price,
                p.supplier
             FROM inventory_stock s
             JOIN inventory_item i ON s.item_id = i.item_id
             JOIN purchase p ON s.purchase_id = p.purchase_id
             ORDER BY i.category, i.item_name`,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get stock by ID
exports.getStockById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { stockId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT 
                s.*,
                i.item_name,
                i.brand,
                i.category,
                i.unit,
                p.purchase_date,
                p.buying_price,
                p.supplier
             FROM inventory_stock s
             JOIN inventory_item i ON s.item_id = i.item_id
             JOIN purchase p ON s.purchase_id = p.purchase_id
             WHERE s.stock_id = ?`,
            [stockId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Stock entry not found" });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get stock by item ID
exports.getStockByItemId = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { itemId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT 
                s.*,
                i.item_name,
                i.brand,
                i.category,
                i.unit,
                p.purchase_date,
                p.buying_price,
                p.supplier
             FROM inventory_stock s
             JOIN inventory_item i ON s.item_id = i.item_id
             JOIN purchase p ON s.purchase_id = p.purchase_id
             WHERE s.item_id = ?
             ORDER BY p.purchase_date`,
            [itemId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Update stock quantity (Manager and Admin only)
exports.updateStock = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can update stock" });
        }

        const { stockId } = req.params;
        const { quantity_available } = req.body;

        const db = req.db;

        // Validate quantity
        if (quantity_available < 0) {
            return res.status(400).json({ message: "Quantity cannot be negative" });
        }

        // Get stock entry and related purchase
        const [stock] = await db.promise().execute(
            "SELECT s.*, p.useful_quantity FROM inventory_stock s JOIN purchase p ON s.purchase_id = p.purchase_id WHERE s.stock_id = ?",
            [stockId]
        );

        if (stock.length === 0) {
            return res.status(404).json({ message: "❌ Stock entry not found" });
        }

        // Check if new quantity would exceed purchase's useful_quantity
        const [otherStock] = await db.promise().execute(
            "SELECT COALESCE(SUM(quantity_available), 0) as total_stock FROM inventory_stock WHERE purchase_id = ? AND stock_id != ?",
            [stock[0].purchase_id, stockId]
        );

        const totalOtherStock = otherStock[0].total_stock;
        const maxAllowedQuantity = stock[0].useful_quantity - totalOtherStock;

        if (quantity_available > maxAllowedQuantity) {
            return res.status(400).json({ 
                message: "❌ Quantity exceeds remaining useful quantity from purchase",
                max_allowed_quantity: maxAllowedQuantity
            });
        }

        // Update stock
        await db.promise().execute(
            "UPDATE inventory_stock SET quantity_available = ? WHERE stock_id = ?",
            [quantity_available, stockId]
        );

        res.status(200).json({ message: "✅ Stock quantity updated successfully" });
    } catch (error) {
        console.error("Update Stock Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete stock entry (Manager and Admin only)
exports.deleteStock = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can delete stock entries" });
        }

        const { stockId } = req.params;
        const db = req.db;

        // Check if stock exists
        const [stock] = await db.promise().execute(
            "SELECT * FROM inventory_stock WHERE stock_id = ?",
            [stockId]
        );

        if (stock.length === 0) {
            return res.status(404).json({ message: "❌ Stock entry not found" });
        }

        // Delete stock entry
        await db.promise().execute(
            "DELETE FROM inventory_stock WHERE stock_id = ?",
            [stockId]
        );

        res.status(200).json({ message: "✅ Stock entry deleted successfully" });
    } catch (error) {
        console.error("Delete Stock Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get total available stock for an item
exports.getTotalStockByItemId = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { itemId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT 
                i.item_id,
                i.item_name,
                i.brand,
                i.category,
                i.unit,
                i.restock_level,
                COALESCE(SUM(s.quantity_available), 0) as total_quantity
             FROM inventory_item i
             LEFT JOIN inventory_stock s ON i.item_id = s.item_id
             WHERE i.item_id = ?
             GROUP BY i.item_id`,
            [itemId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Item not found" });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get stock analytics
exports.getStockAnalytics = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const db = req.db;

        // Get total items and items below restock level
        const [stockSummary] = await db.promise().execute(`
            SELECT 
                COUNT(DISTINCT i.item_id) as total_items,
                SUM(CASE WHEN COALESCE(s.total_quantity, 0) < i.restock_level THEN 1 ELSE 0 END) as items_below_restock
            FROM inventory_item i
            LEFT JOIN (
                SELECT item_id, SUM(quantity_available) as total_quantity
                FROM inventory_stock
                GROUP BY item_id
            ) s ON i.item_id = s.item_id
        `);

        // Get stock value by category
        const [categoryValue] = await db.promise().execute(`
            SELECT 
                i.category,
                COUNT(DISTINCT i.item_id) as item_count,
                SUM(s.quantity_available) as total_quantity,
                SUM(s.quantity_available * p.buying_price) as total_value
            FROM inventory_item i
            LEFT JOIN inventory_stock s ON i.item_id = s.item_id
            LEFT JOIN purchase p ON s.purchase_id = p.purchase_id
            GROUP BY i.category
            ORDER BY total_value DESC
        `);

        // Get items below restock level with details
        const [lowStockItems] = await db.promise().execute(`
            SELECT 
                i.item_id,
                i.item_name,
                i.category,
                i.restock_level,
                COALESCE(s.total_quantity, 0) as current_stock
            FROM inventory_item i
            LEFT JOIN (
                SELECT item_id, SUM(quantity_available) as total_quantity
                FROM inventory_stock
                GROUP BY item_id
            ) s ON i.item_id = s.item_id
            WHERE COALESCE(s.total_quantity, 0) < i.restock_level
            ORDER BY (i.restock_level - COALESCE(s.total_quantity, 0)) DESC
        `);

        // Get recent stock movements (last 10)
        const [recentMovements] = await db.promise().execute(`
            SELECT 
                ir.release_id,
                ir.date_time,
                i.item_name,
                i.category,
                ir.quantity as quantity_released,
                o.order_type
            FROM inventory_release ir
            JOIN inventory_item i ON ir.item_id = i.item_id
            LEFT JOIN orders o ON ir.order_id = o.order_id
            ORDER BY ir.date_time DESC
            LIMIT 10
        `);

        // Get most used items (last 30 days)
        const [mostUsedItems] = await db.promise().execute(`
            SELECT 
                i.item_id,
                i.item_name,
                i.category,
                COUNT(ir.release_id) as usage_count,
                SUM(ir.quantity) as total_quantity_used
            FROM inventory_item i
            LEFT JOIN inventory_release ir ON i.item_id = ir.item_id
            WHERE ir.date_time >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY i.item_id, i.item_name, i.category
            ORDER BY total_quantity_used DESC
            LIMIT 10
        `);

        res.status(200).json({
            summary: stockSummary[0],
            categoryValue,
            lowStockItems,
            recentMovements,
            mostUsedItems
        });
    } catch (error) {
        console.error("Get Stock Analytics Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}; 