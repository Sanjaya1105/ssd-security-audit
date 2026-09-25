/**
 * ProductLogController.js
 * Handles the creation and management of production logs.
 * Production logs track the planned vs. actual quantities of products produced.
 * When a production log is created, a MySQL trigger automatically updates the product_stock table.
 */

/**
 * Create a new production log entry
 * This will trigger the MySQL trigger to update product_stock
 */
exports.create = async (req, res) => {
    const db = req.db;
    const { 
        product_id, 
        product_inventory_release_id, 
        planned_quantity, 
        actual_quantity,
        notes 
    } = req.body;
    
    // Validate required fields
    if (!product_id || !product_inventory_release_id || !planned_quantity || !actual_quantity) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: product_id, product_inventory_release_id, planned_quantity, and actual_quantity are required"
        });
    }

    try {
        // Verify product exists
        const [productRows] = await db.promise().execute(
            'SELECT product_id, product_name FROM product WHERE product_id = ?',
            [product_id]
        );
        
        if (productRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Product with ID ${product_id} not found`
            });
        }
        
        // Verify production_inventory_release exists
        const [releaseRows] = await db.promise().execute(
            'SELECT product_inventory_release_id FROM product_inventory_release WHERE product_inventory_release_id = ?',
            [product_inventory_release_id]
        );
        
        if (releaseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Product inventory release with ID ${product_inventory_release_id} not found`
            });
        }
        
        // Validate quantities
        if (planned_quantity <= 0 || actual_quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Planned and actual quantities must be greater than zero"
            });
        }
        
        // Create the production log entry
        const [result] = await db.promise().execute(
            `INSERT INTO production_log 
                (product_id, product_inventory_release_id, planned_quantity, actual_quantity, date_time, notes) 
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [product_id, product_inventory_release_id, planned_quantity, actual_quantity, notes || null]
        );
        
        // The MySQL trigger will automatically update the product_stock table
        
        const productionId = result.insertId;
        
        // Get the complete production log record with product name
        const [logRows] = await db.promise().execute(
            `SELECT pl.*, p.product_name 
             FROM production_log pl
             JOIN product p ON pl.product_id = p.product_id
             WHERE pl.production_id = ?`,
            [productionId]
        );
        
        res.status(201).json({
            success: true,
            message: "Production log created successfully and product stock updated",
            data: logRows[0]
        });
        
    } catch (error) {
        console.error('Error creating production log:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating production log',
            error: error.message
        });
    }
};

/**
 * Get all production logs
 */
exports.getAll = async (req, res) => {
    try {
        const db = req.db;
        
        // Get query parameters for filtering
        const { startDate, endDate, product_id } = req.query;
        
        let query = `
            SELECT pl.*, p.product_name 
            FROM production_log pl
            JOIN product p ON pl.product_id = p.product_id
        `;
        
        const queryParams = [];
        const conditions = [];
        
        // Add filters
        if (startDate && endDate) {
            conditions.push("pl.date_time BETWEEN ? AND ?");
            queryParams.push(startDate, endDate);
        }
        
        if (product_id) {
            conditions.push("pl.product_id = ?");
            queryParams.push(product_id);
        }
        
        // Add WHERE clause if any conditions exist
        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }
        
        // Add ordering
        query += " ORDER BY pl.date_time DESC";
        
        const [rows] = await db.promise().execute(query, queryParams);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching production logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching production logs',
            error: error.message
        });
    }
};

/**
 * Get a single production log by ID with related product stock info
 */
exports.getById = async (req, res) => {
    try {
        const db = req.db;
        const { id } = req.params;
        
        // Get the production log
        const [logRows] = await db.promise().execute(
            `SELECT pl.*, p.product_name 
             FROM production_log pl
             JOIN product p ON pl.product_id = p.product_id
             WHERE pl.production_id = ?`,
            [id]
        );
        
        if (logRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Production log not found'
            });
        }
        
        // Get the related product stock
        const [stockRows] = await db.promise().execute(
            `SELECT * FROM product_stock 
             WHERE production_id = ?`,
            [id]
        );
        
        // Get the production inventory release details
        const [releaseRows] = await db.promise().execute(
            `SELECT pir.*, p.product_name
             FROM production_inventory_release pir
             JOIN product p ON pir.product_id = p.product_id
             WHERE pir.product_inventory_release_id = ?`,
            [logRows[0].product_inventory_release_id]
        );
        
        const releaseDetails = releaseRows.length > 0 ? releaseRows[0] : null;
        
        res.json({
            success: true,
            data: {
                ...logRows[0],
                product_stock: stockRows,
                release_details: releaseDetails
            }
        });
    } catch (error) {
        console.error('Error fetching production log:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching production log',
            error: error.message
        });
    }
};

/**
 * Update a production log and adjust product stock accordingly
 */
exports.update = async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { planned_quantity, actual_quantity, notes } = req.body;
    
    try {
        // Start a transaction
        await db.promise().beginTransaction();
        
        try {
            // Get the current production log
            const [currentLogRows] = await db.promise().execute(
                'SELECT * FROM production_log WHERE production_id = ?',
                [id]
            );
            
            if (currentLogRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Production log not found'
                });
            }
            
            const currentLog = currentLogRows[0];
            
            // Calculate the difference in actual quantity
            const quantityDifference = actual_quantity - currentLog.actual_quantity;
            
            // Update the production log
            await db.promise().execute(
                'UPDATE production_log SET planned_quantity = ?, actual_quantity = ?, notes = ? WHERE production_id = ?',
                [planned_quantity || currentLog.planned_quantity, 
                 actual_quantity || currentLog.actual_quantity, 
                 notes !== undefined ? notes : currentLog.notes, 
                 id]
            );
            
            // Update product stock manually (since trigger only works on INSERT)
            if (quantityDifference !== 0) {
                await db.promise().execute(
                    `UPDATE product_stock 
                     SET quantity_available = quantity_available + ?, 
                         last_updated = NOW() 
                     WHERE production_id = ? OR (product_id = ? AND production_id IN 
                        (SELECT production_id FROM production_log WHERE product_id = ? LIMIT 1))`,
                    [quantityDifference, id, currentLog.product_id, currentLog.product_id]
                );
            }
            
            // Commit the transaction
            await db.promise().commit();
            
            // Get the updated production log
            const [updatedLogRows] = await db.promise().execute(
                `SELECT pl.*, p.product_name 
                 FROM production_log pl
                 JOIN product p ON pl.product_id = p.product_id
                 WHERE pl.production_id = ?`,
                [id]
            );
            
            res.json({
                success: true,
                message: 'Production log updated successfully',
                data: updatedLogRows[0]
            });
            
        } catch (error) {
            // Rollback the transaction in case of error
            await db.promise().rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error updating production log:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating production log',
            error: error.message
        });
    }
};

/**
 * Delete a production log and update product stock
 */
exports.delete = async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    
    try {
        // Start a transaction
        await db.promise().beginTransaction();
        
        try {
            // Get the current production log
            const [currentLogRows] = await db.promise().execute(
                'SELECT * FROM production_log WHERE production_id = ?',
                [id]
            );
            
            if (currentLogRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Production log not found'
                });
            }
            
            const currentLog = currentLogRows[0];
            
            // Check if this is the only production record for this product
            const [countRows] = await db.promise().execute(
                'SELECT COUNT(*) as count FROM production_log WHERE product_id = ?',
                [currentLog.product_id]
            );
            
            const isOnlyRecord = countRows[0].count === 1;
            
            if (isOnlyRecord) {
                // If it's the only record, the product_stock will be deleted via CASCADE
                // Nothing to do manually in this case
            } else {
                // If there are other records, update the product_stock
                await db.promise().execute(
                    `UPDATE product_stock 
                     SET quantity_available = quantity_available - ?, 
                         last_updated = NOW(),
                         production_id = (
                             SELECT production_id 
                             FROM production_log 
                             WHERE product_id = ? AND production_id != ?
                             ORDER BY date_time DESC
                             LIMIT 1
                         )
                     WHERE product_id = ? AND production_id = ?`,
                    [currentLog.actual_quantity, currentLog.product_id, id, currentLog.product_id, id]
                );
            }
            
            // Delete the production log (will cascade delete related product_stock if this is the only record)
            await db.promise().execute(
                'DELETE FROM production_log WHERE production_id = ?',
                [id]
            );
            
            // Commit the transaction
            await db.promise().commit();
            
            res.json({
                success: true,
                message: 'Production log deleted successfully and product stock updated'
            });
            
        } catch (error) {
            // Rollback the transaction in case of error
            await db.promise().rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting production log:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting production log',
            error: error.message
        });
    }
};

/**
 * Get product stock summary
 */
exports.getProductStock = async (req, res) => {
    try {
        const db = req.db;
        
        const [rows] = await db.promise().execute(
            `SELECT ps.*, p.product_name, p.selling_price, p.image_url 
             FROM product_stock ps
             JOIN product p ON ps.product_id = p.product_id
             ORDER BY ps.last_updated DESC`
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching product stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product stock',
            error: error.message
        });
    }
};

module.exports = exports; 