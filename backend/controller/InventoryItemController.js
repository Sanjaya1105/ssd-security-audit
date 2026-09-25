require("dotenv").config();

// Create new inventory item (Manager and Admin only)
exports.createItem = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create inventory items" });
        }

        const {
            item_name,
            item_description,
            category,
            brand,
            unit,
            restock_level
        } = req.body;

        const db = req.db;

        // Check if item with same name and brand already exists
        const [existingItem] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_name = ? AND brand = ?",
            [item_name, brand]
        );

        if (existingItem.length > 0) {
            return res.status(400).json({ 
                message: "❌ An item with this name and brand already exists" 
            });
        }

        // Create inventory item
        const [result] = await db.promise().execute(
            `INSERT INTO inventory_item (
                item_name, item_description, category,
                brand, unit, restock_level
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [item_name, item_description, category, brand, unit, restock_level || 5]
        );

        res.status(201).json({
            message: "✅ Inventory item created successfully",
            item_id: result.insertId
        });
    } catch (error) {
        console.error("Create Item Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all inventory items
exports.getAllItems = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const db = req.db;
        db.execute(
            "SELECT * FROM inventory_item ORDER BY category, item_name",
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get inventory item by ID
exports.getItemById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { itemId } = req.params;
        const db = req.db;

        db.execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
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

// Update inventory item (Manager and Admin only)
exports.updateItem = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can update inventory items" });
        }

        const { itemId } = req.params;
        const {
            item_name,
            item_description,
            category,
            brand,
            unit,
            restock_level
        } = req.body;

        const db = req.db;

        // Check if item exists
        const [existingItem] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
            [itemId]
        );

        if (existingItem.length === 0) {
            return res.status(404).json({ message: "❌ Item not found" });
        }

        // Check if updated name and brand would conflict with another item
        const [conflictItem] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_name = ? AND brand = ? AND item_id != ?",
            [item_name, brand, itemId]
        );

        if (conflictItem.length > 0) {
            return res.status(400).json({ 
                message: "❌ Another item with this name and brand already exists" 
            });
        }

        // Update item
        await db.promise().execute(
            `UPDATE inventory_item 
             SET item_name = ?, item_description = ?, category = ?,
                 brand = ?, unit = ?, restock_level = ?
             WHERE item_id = ?`,
            [item_name, item_description, category, brand, unit, restock_level, itemId]
        );

        res.status(200).json({ message: "✅ Inventory item updated successfully" });
    } catch (error) {
        console.error("Update Item Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete inventory item (Manager and Admin only)
exports.deleteItem = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can delete inventory items" });
        }

        const { itemId } = req.params;
        const db = req.db;

        // Check if item exists
        const [existingItem] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
            [itemId]
        );

        if (existingItem.length === 0) {
            return res.status(404).json({ message: "❌ Item not found" });
        }

        // Delete item
        await db.promise().execute(
            "DELETE FROM inventory_item WHERE item_id = ?",
            [itemId]
        );

        res.status(200).json({ message: "✅ Inventory item deleted successfully" });
    } catch (error) {
        console.error("Delete Item Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get items by category
exports.getItemsByCategory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { category } = req.params;
        const db = req.db;

        db.execute(
            "SELECT * FROM inventory_item WHERE category = ? ORDER BY item_name",
            [category],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const db = req.db;
        db.execute(
            "SELECT DISTINCT category FROM inventory_item ORDER BY category",
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results.map(r => r.category));
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Create new category (Manager and Admin only)
exports.createCategory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create categories" });
        }

        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const db = req.db;

        // Check if category already exists
        const [existingCategory] = await db.promise().execute(
            "SELECT DISTINCT category FROM inventory_item WHERE category = ?",
            [category]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({ 
                message: "❌ Category already exists" 
            });
        }

        // Create a dummy item with the new category to establish it
        await db.promise().execute(
            `INSERT INTO inventory_item (
                item_name, item_description, category,
                brand, unit, restock_level
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Category Placeholder', 'This is a placeholder item for the category', category, 'System', 'N/A', 0]
        );

        res.status(201).json({
            message: "✅ Category created successfully",
            category
        });
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}; 