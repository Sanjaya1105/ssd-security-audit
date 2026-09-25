require("dotenv").config();

// Create new purchase (Manager and Admin only)
exports.createPurchase = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create purchases" });
        }

        const {
            item_id,
            purchase_date,
            purchased_quantity,
            wasted_quantity,
            useful_quantity,
            buying_price,
            supplier
        } = req.body;

        const db = req.db;

        // Validate quantities
        if (purchased_quantity < 0 || wasted_quantity < 0 || useful_quantity < 0) {
            return res.status(400).json({ message: "Quantities cannot be negative" });
        }

        if (wasted_quantity + useful_quantity > purchased_quantity) {
            return res.status(400).json({ message: "Sum of wasted and useful quantities cannot exceed purchased quantity" });
        }

        // Check if item exists
        const [item] = await db.promise().execute(
            "SELECT * FROM inventory_item WHERE item_id = ?",
            [item_id]
        );

        if (item.length === 0) {
            return res.status(404).json({ message: "❌ Item not found" });
        }

        // Create purchase record
        const [result] = await db.promise().execute(
            `INSERT INTO purchase (
                item_id, purchase_date, purchased_quantity,
                wasted_quantity, useful_quantity, buying_price, supplier
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [item_id, purchase_date, purchased_quantity, wasted_quantity, useful_quantity, buying_price, supplier]
        );

        res.status(201).json({
            message: "✅ Purchase record created successfully",
            purchase_id: result.insertId
        });
    } catch (error) {
        console.error("Create Purchase Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all purchases
exports.getAllPurchases = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Only managers and admins can view all purchases
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can view purchases" });
        }

        const db = req.db;
        db.execute(
            `SELECT p.*, i.item_name, i.brand, i.category 
             FROM purchase p
             JOIN inventory_item i ON p.item_id = i.item_id
             ORDER BY p.purchase_date DESC`,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Only managers and admins can view purchase details
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can view purchase details" });
        }

        const { purchaseId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT p.*, i.item_name, i.brand, i.category 
             FROM purchase p
             JOIN inventory_item i ON p.item_id = i.item_id
             WHERE p.purchase_id = ?`,
            [purchaseId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Purchase record not found" });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get purchases by item ID
exports.getPurchasesByItemId = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Only managers and admins can view purchases
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can view purchases" });
        }

        const { itemId } = req.params;
        const db = req.db;

        db.execute(
            `SELECT p.*, i.item_name, i.brand, i.category 
             FROM purchase p
             JOIN inventory_item i ON p.item_id = i.item_id
             WHERE p.item_id = ?
             ORDER BY p.purchase_date DESC`,
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

// Update purchase
exports.updatePurchase = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can update purchases" });
        }

        const { purchaseId } = req.params;
        const {
            purchase_date,
            purchased_quantity,
            wasted_quantity,
            useful_quantity,
            buying_price,
            supplier
        } = req.body;

        const db = req.db;

        // Validate quantities
        if (purchased_quantity < 0 || wasted_quantity < 0 || useful_quantity < 0) {
            return res.status(400).json({ message: "Quantities cannot be negative" });
        }

        if (wasted_quantity + useful_quantity > purchased_quantity) {
            return res.status(400).json({ message: "Sum of wasted and useful quantities cannot exceed purchased quantity" });
        }

        // Check if purchase exists
        const [existingPurchase] = await db.promise().execute(
            "SELECT * FROM purchase WHERE purchase_id = ?",
            [purchaseId]
        );

        if (existingPurchase.length === 0) {
            return res.status(404).json({ message: "❌ Purchase record not found" });
        }

        // Update purchase
        await db.promise().execute(
            `UPDATE purchase 
             SET purchase_date = ?, purchased_quantity = ?,
                 wasted_quantity = ?, useful_quantity = ?,
                 buying_price = ?, supplier = ?
             WHERE purchase_id = ?`,
            [purchase_date, purchased_quantity, wasted_quantity, useful_quantity, buying_price, supplier, purchaseId]
        );

        res.status(200).json({ message: "✅ Purchase record updated successfully" });
    } catch (error) {
        console.error("Update Purchase Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can delete purchases" });
        }

        const { purchaseId } = req.params;
        const db = req.db;

        // Check if purchase exists
        const [existingPurchase] = await db.promise().execute(
            "SELECT * FROM purchase WHERE purchase_id = ?",
            [purchaseId]
        );

        if (existingPurchase.length === 0) {
            return res.status(404).json({ message: "❌ Purchase record not found" });
        }

        // Delete purchase
        await db.promise().execute(
            "DELETE FROM purchase WHERE purchase_id = ?",
            [purchaseId]
        );

        res.status(200).json({ message: "✅ Purchase record deleted successfully" });
    } catch (error) {
        console.error("Delete Purchase Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}; 