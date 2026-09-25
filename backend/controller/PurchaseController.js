require("dotenv").config();
const mysql = require('mysql2');

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

// Create new purchase with automatic stock entry (Manager and Admin only)
exports.createPurchaseWithStock = async (req, res) => {
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

        // Automatically create inventory stock entry
        await db.promise().execute(
            `INSERT INTO inventory_stock (
                purchase_id, item_id, quantity_available
            ) VALUES (?, ?, ?)`,
            [result.insertId, item_id, useful_quantity]
        );
        console.log(useful_quantity);
        
        res.status(201).json({
            message: "✅ Purchase record created successfully and stock updated",
            purchase_id: result.insertId
        });
    } catch (error) {
        console.error("Create Purchase with Stock Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all purchases with filtering and search
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
        
        if (!db) {
            console.error("Database connection not found in request");
            return res.status(500).json({ message: "Database connection error" });
        }

        // Simple query first to test connection
        const query = `
            SELECT p.*, i.item_name, i.brand, i.category 
            FROM purchase p
            JOIN inventory_item i ON p.item_id = i.item_id
            ORDER BY p.purchase_date DESC
        `;

        console.log("Executing query:", query);

        try {
            const [results] = await db.promise().execute(query);
            console.log("Query successful, found", results.length, "records");
            res.status(200).json(results);
        } catch (dbError) {
            console.error("Database query error:", dbError);
            return res.status(500).json({ 
                message: "Database query failed", 
                error: dbError.message,
                code: dbError.code
            });
        }
    } catch (error) {
        console.error("Get Purchases Error:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

// Get purchase summary report
exports.getPurchaseSummaryReport = async (req, res) => {
    try {
        if (!req.user || !['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can access reports" });
        }

        const { startDate, endDate, groupBy = 'monthly' } = req.query;
        const db = req.db;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        let timeGrouping;
        switch (groupBy) {
            case 'daily':
                timeGrouping = 'DATE(p.purchase_date)';
                break;
            case 'weekly':
                timeGrouping = 'YEARWEEK(p.purchase_date, 1)';
                break;
            case 'monthly':
                timeGrouping = 'DATE_FORMAT(p.purchase_date, "%Y-%m")';
                break;
            case 'yearly':
                timeGrouping = 'YEAR(p.purchase_date)';
                break;
            default:
                timeGrouping = 'DATE_FORMAT(p.purchase_date, "%Y-%m")';
        }

        const query = `
            SELECT 
                ${timeGrouping} as time_period,
                COUNT(DISTINCT p.purchase_id) as total_purchases,
                COUNT(DISTINCT p.supplier) as unique_suppliers,
                COUNT(DISTINCT p.item_id) as unique_items,
                SUM(p.purchased_quantity) as total_quantity,
                SUM(p.wasted_quantity) as total_waste,
                SUM(p.useful_quantity) as total_useful,
                SUM(p.purchased_quantity * p.buying_price) as total_cost,
                SUM(p.wasted_quantity * p.buying_price) as total_waste_cost,
                AVG(p.buying_price) as average_price,
                GROUP_CONCAT(DISTINCT i.category) as categories
            FROM purchase p
            JOIN inventory_item i ON p.item_id = i.item_id
            WHERE p.purchase_date BETWEEN ? AND ?
            GROUP BY ${timeGrouping}
            ORDER BY time_period DESC
        `;

        const [results] = await db.promise().execute(query, [startDate, endDate]);

        // Calculate additional metrics
        const enrichedResults = results.map(row => ({
            ...row,
            waste_percentage: ((row.total_waste / row.total_quantity) * 100).toFixed(2),
            categories: row.categories.split(','),
            efficiency_rate: ((row.total_useful / row.total_quantity) * 100).toFixed(2)
        }));

        // Get category-wise summary
        const categoryQuery = `
            SELECT 
                i.category,
                COUNT(p.purchase_id) as purchase_count,
                SUM(p.purchased_quantity) as total_quantity,
                SUM(p.purchased_quantity * p.buying_price) as total_cost,
                AVG(p.buying_price) as average_price
            FROM purchase p
            JOIN inventory_item i ON p.item_id = i.item_id
            WHERE p.purchase_date BETWEEN ? AND ?
            GROUP BY i.category
            ORDER BY total_cost DESC
        `;

        const [categoryResults] = await db.promise().execute(categoryQuery, [startDate, endDate]);

        // Get supplier-wise summary
        const supplierQuery = `
            SELECT 
                p.supplier,
                COUNT(p.purchase_id) as purchase_count,
                SUM(p.purchased_quantity) as total_quantity,
                SUM(p.purchased_quantity * p.buying_price) as total_cost,
                COUNT(DISTINCT p.item_id) as unique_items
            FROM purchase p
            WHERE p.purchase_date BETWEEN ? AND ?
            GROUP BY p.supplier
            ORDER BY total_cost DESC
        `;

        const [supplierResults] = await db.promise().execute(supplierQuery, [startDate, endDate]);

        res.status(200).json({
            timeSeries: enrichedResults,
            categoryAnalysis: categoryResults,
            supplierAnalysis: supplierResults,
            summary: {
                totalPurchases: results.reduce((sum, row) => sum + row.total_purchases, 0),
                totalCost: results.reduce((sum, row) => sum + row.total_cost, 0),
                totalWasteCost: results.reduce((sum, row) => sum + row.total_waste_cost, 0),
                averageWastePercentage: (results.reduce((sum, row) => sum + parseFloat(((row.total_waste / row.total_quantity) * 100).toFixed(2)), 0) / results.length).toFixed(2),
                topSuppliers: supplierResults.slice(0, 5),
                topCategories: categoryResults.slice(0, 5)
            }
        });
    } catch (error) {
        console.error("Generate Report Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get waste analysis report
exports.getWasteAnalysisReport = async (req, res) => {
    try {
        if (!req.user || !['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can access reports" });
        }

        const { startDate, endDate } = req.query;
        const db = req.db;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        const query = `
            SELECT 
                i.category,
                i.item_name,
                SUM(p.purchased_quantity) as total_purchased,
                SUM(p.wasted_quantity) as total_wasted,
                SUM(p.useful_quantity) as total_useful,
                SUM(p.wasted_quantity * p.buying_price) as waste_cost,
                (SUM(p.wasted_quantity) / SUM(p.purchased_quantity) * 100) as waste_percentage,
                AVG(p.buying_price) as average_price
            FROM purchase p
            JOIN inventory_item i ON p.item_id = i.item_id
            WHERE p.purchase_date BETWEEN ? AND ?
            GROUP BY i.item_id, i.category, i.item_name
            HAVING waste_percentage > 0
            ORDER BY waste_percentage DESC
        `;

        const [results] = await db.promise().execute(query, [startDate, endDate]);

        // Group by category
        const categoryAnalysis = results.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = {
                    total_purchased: 0,
                    total_wasted: 0,
                    total_useful: 0,
                    waste_cost: 0,
                    items: []
                };
            }
            
            acc[item.category].total_purchased += item.total_purchased;
            acc[item.category].total_wasted += item.total_wasted;
            acc[item.category].total_useful += item.total_useful;
            acc[item.category].waste_cost += item.waste_cost;
            acc[item.category].items.push(item);
            
            return acc;
        }, {});

        // Calculate category-wise waste percentages
        Object.keys(categoryAnalysis).forEach(category => {
            const data = categoryAnalysis[category];
            data.waste_percentage = ((data.total_wasted / data.total_purchased) * 100).toFixed(2);
        });

        res.status(200).json({
            itemWiseAnalysis: results,
            categoryWiseAnalysis: categoryAnalysis,
            summary: {
                totalWasteCost: results.reduce((sum, item) => sum + item.waste_cost, 0),
                averageWastePercentage: (results.reduce((sum, item) => sum + item.waste_percentage, 0) / results.length).toFixed(2),
                highestWasteItems: results.slice(0, 5),
                totalItems: results.length,
                affectedCategories: Object.keys(categoryAnalysis).length
            }
        });
    } catch (error) {
        console.error("Waste Analysis Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}; 

exports.processOrder = async (req, res) => {
    const db = req.db;
    const order_id = req.params.id;

    if (!order_id) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    try {
        await db.promise().beginTransaction();

        // 1. Get all releases for this order (NO CONDITION)
        const [releases] = await db.promise().execute(
            `SELECT release_id, item_id, quantity FROM inventory_release WHERE order_id = ?`,
            [order_id]
        );

        if (releases.length === 0) {
            throw new Error('No inventory releases found for this order');
        }

        for (const release of releases) {
            console.log(`➡️ Releasing ${release.quantity} units for item_id ${release.item_id} (release_id ${release.release_id})`);

            // 2. Get the oldest stock for the item
            const [[stock]] = await db.promise().execute(
                `SELECT stock_id, quantity_available 
                 FROM inventory_stock 
                 WHERE item_id = ? AND quantity_available >= ? 
                 ORDER BY stock_id ASC LIMIT 1`,
                [release.item_id, release.quantity]
            );

            if (!stock) {
                throw new Error(`❌ Not enough stock for item_id ${release.item_id}`);
            }

            // 3. Deduct from inventory
            await db.promise().execute(
                `UPDATE inventory_stock 
                 SET quantity_available = quantity_available - ? 
                 WHERE stock_id = ?`,
                [release.quantity, stock.stock_id]
            );

            console.log(`✅ Deducted ${release.quantity} from stock_id ${stock.stock_id} for item_id ${release.item_id}`);
        }

        await db.promise().commit();

        res.status(200).json({
            success: true,
            message: `✅ Inventory deducted for order ${order_id}`
        });

    } catch (error) {
        await db.promise().rollback();
        console.error('❌ Error processing order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get purchases by date range
exports.getPurchasesByDateRange = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: User not found in request" });
      }
  
      // Only managers and admins can view purchases
      if (!['manager', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: Only managers and admins can view purchases" });
      }
  
      const { startDate, endDate } = req.query;
  
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
  
      const adjustedEndDate = `${endDate} 23:59:59`;
      const db = req.db;
  
      // Get purchases within date range
      const [purchases] = await db.promise().execute(
        `SELECT p.*, i.item_name, i.brand, i.category 
         FROM purchase p
         JOIN inventory_item i ON p.item_id = i.item_id
         WHERE p.purchase_date BETWEEN ? AND ?
         ORDER BY p.purchase_date DESC`,
        [startDate, adjustedEndDate]
      );
  
      if (purchases.length === 0) {
        return res.status(404).json({ message: "✘ Purchase record not found" });
      }
  
      // Calculate summary statistics
      const [summary] = await db.promise().execute(
        `SELECT 
            COUNT(*) as totalPurchases,
            SUM(purchased_quantity) as totalQuantity,
            SUM(wasted_quantity) as totalWasted,
            SUM(useful_quantity) as totalUseful,
            SUM(buying_price * purchased_quantity) as totalCost,
            AVG(wasted_quantity / purchased_quantity * 100) as averageWastePercentage
         FROM purchase
         WHERE purchase_date BETWEEN ? AND ?`,
        [startDate, adjustedEndDate]
      );
  
      // Get category-wise summary
      const [categoryAnalysis] = await db.promise().execute(
        `SELECT 
            i.category,
            COUNT(*) as purchaseCount,
            SUM(p.purchased_quantity) as totalQuantity,
            SUM(p.wasted_quantity) as totalWasted,
            SUM(p.useful_quantity) as totalUseful,
            SUM(p.buying_price * p.purchased_quantity) as totalCost,
            AVG(p.wasted_quantity / p.purchased_quantity * 100) as wastePercentage
         FROM purchase p
         JOIN inventory_item i ON p.item_id = i.item_id
         WHERE p.purchase_date BETWEEN ? AND ?
         GROUP BY i.category`,
        [startDate, adjustedEndDate]
      );
  
      res.status(200).json({
        success: true,
        data: {
          purchases,
          summary: summary[0],
          categoryAnalysis
        }
      });
  
    } catch (error) {
      console.error("Get Purchases by Date Range Error:", error);
      res.status(500).json({ 
        message: "Server Error", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };