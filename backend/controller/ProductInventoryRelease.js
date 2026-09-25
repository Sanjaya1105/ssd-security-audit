const util = require('util');

/**
 * Create a product inventory release entry and process the inventory
 * This function handles:
 * 1. Creating product_inventory_release entry
 * 2. Getting recipe items for the product
 * 3. Calculating required quantities
 * 4. Releasing inventory using FIFO
 * 5. Creating product_inventory_release_items entries
 * 6. Updating inventory_stock
 */
exports.create = async (req, res) => {
    const db = req.db;
    const { product_id, quantity } = req.body;
    
    if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: "Product ID and a positive quantity are required"
        });
    }

    try {
        // Start a transaction
        await db.promise().beginTransaction();
        
        try {
            // Verify product exists
            const [productRows] = await db.promise().execute(
                'SELECT product_id, product_name FROM product WHERE product_id = ?',
                [product_id]
            );
            
            if (productRows.length === 0) {
                throw new Error(`Product with ID ${product_id} not found`);
            }
            
            const product = productRows[0];
            console.log(`Processing inventory release for product: ${product.product_name}, quantity: ${quantity}`);
            
            // Create product_inventory_release entry
            const currentDate = new Date();
            const dateString = currentDate.toISOString().split('T')[0];
            const timeString = currentDate.toTimeString().split(' ')[0];
            
            const [releaseResult] = await db.promise().execute(
                'INSERT INTO product_inventory_release (product_id, quantity, date, time) VALUES (?, ?, ?, ?)',
                [product_id, quantity, dateString, timeString]
            );
            
            const product_inventory_release_id = releaseResult.insertId;
            
            // Get recipe for this product
            const [recipeRows] = await db.promise().execute(
                `SELECT r.ingredient_item_id, r.quantity_required_per_unit, 
                        ii.item_name 
                 FROM recipe r
                 JOIN inventory_item ii ON r.ingredient_item_id = ii.item_id
                 WHERE r.product_item_id = ?`,
                [product_id]
            );
            
            if (recipeRows.length === 0) {
                throw new Error(`No recipe found for product ID: ${product_id}`);
            }
            
            // Process each ingredient
            for (const recipe of recipeRows) {
                const requiredQuantity = quantity * recipe.quantity_required_per_unit;
                console.log(`Processing ingredient: ${recipe.item_name}, required quantity: ${requiredQuantity}`);
                
                // Get available stock using FIFO (oldest first)
                const [stockRows] = await db.promise().execute(
                    `SELECT stock_id, quantity_available, item_id 
                     FROM inventory_stock
                     WHERE item_id = ? AND quantity_available > 0
                     ORDER BY stock_id ASC`,
                    [recipe.ingredient_item_id]
                );
                
                // Check if we have enough total inventory
                const totalAvailable = stockRows.reduce((sum, stock) => sum + stock.quantity_available, 0);
                
                if (totalAvailable < requiredQuantity) {
                    throw new Error(`Insufficient inventory for ${recipe.item_name}. Required: ${requiredQuantity}, Available: ${totalAvailable}`);
                }
                
                let remainingQuantity = requiredQuantity;
                
                // Use FIFO to allocate inventory
                for (const stock of stockRows) {
                    if (remainingQuantity <= 0) break;
                    
                    const deductAmount = Math.min(remainingQuantity, stock.quantity_available);
                    
                    // Skip if there's nothing to deduct
                    if (deductAmount <= 0) continue;
                    
                    // Get current stock before update to verify later
                    const [currentStock] = await db.promise().execute(
                        `SELECT quantity_available FROM inventory_stock WHERE stock_id = ?`,
                        [stock.stock_id]
                    );
                    
                    if (currentStock.length === 0 || currentStock[0].quantity_available < deductAmount) {
                        throw new Error(`Stock ID ${stock.stock_id} has insufficient quantity or has been modified`);
                    }
                    
                    // Update inventory stock without the strict validation
                    const [updateResult] = await db.promise().execute(
                        `UPDATE inventory_stock 
                         SET quantity_available = quantity_available - ? 
                         WHERE stock_id = ?`,
                        [deductAmount, stock.stock_id]
                    );
                    
                    if (updateResult.affectedRows === 0) {
                        throw new Error(`Failed to update inventory for stock ID ${stock.stock_id}`);
                    }
                    
                    // Create product_inventory_release_items entry
                    await db.promise().execute(
                        `INSERT INTO product_inventory_release_items 
                         (product_inventory_release_id, item_id, quantity, stock_id)
                         VALUES (?, ?, ?, ?)`,
                        [product_inventory_release_id, recipe.ingredient_item_id, deductAmount, stock.stock_id]
                    );
                    
                    console.log(`Released ${deductAmount} units of ${recipe.item_name} from stock ID ${stock.stock_id}`);
                    remainingQuantity -= deductAmount;
                }
                
                if (remainingQuantity > 0) {
                    throw new Error(`Could not fulfill entire quantity for ${recipe.item_name}. Still need ${remainingQuantity} units.`);
                }
            }
            
            // Commit transaction
            await db.promise().commit();
            
            res.status(201).json({
                success: true,
                message: "Product inventory released successfully",
                data: {
                    product_inventory_release_id,
                    product_id,
                    product_name: product.product_name,
                    quantity,
                    date: dateString,
                    time: timeString
                }
            });
            
        } catch (error) {
            // Rollback transaction on error
            await db.promise().rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('Error releasing product inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error releasing product inventory',
            error: error.message
        });
    }
};

/**
 * Get all product inventory releases
 */
exports.getAll = async (req, res) => {
    try {
        const [releases] = await req.db.promise().execute(
            `SELECT pir.*, p.product_name
             FROM product_inventory_release pir
             JOIN product p ON pir.product_id = p.product_id
             ORDER BY pir.date DESC, pir.time DESC`
        );
        
        res.json({
            success: true,
            data: releases
        });
    } catch (error) {
        console.error('Error fetching product inventory releases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product inventory releases',
            error: error.message
        });
    }
};

/**
 * Get a single product inventory release with its items
 */
exports.getById = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get release header
        const [releaseRows] = await req.db.promise().execute(
            `SELECT pir.*, p.product_name
             FROM product_inventory_release pir
             JOIN product p ON pir.product_id = p.product_id
             WHERE pir.product_inventory_release_id = ?`,
            [id]
        );
        
        if (releaseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product inventory release not found'
            });
        }
        
        const release = releaseRows[0];
        
        // Get release items
        const [itemRows] = await req.db.promise().execute(
            `SELECT piri.*, ii.item_name, ii.unit
             FROM product_inventory_release_items piri
             JOIN inventory_item ii ON piri.item_id = ii.item_id
             WHERE piri.product_inventory_release_id = ?`,
            [id]
        );
        
        res.json({
            success: true,
            data: {
                ...release,
                items: itemRows
            }
        });
    } catch (error) {
        console.error('Error fetching product inventory release:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product inventory release',
            error: error.message
        });
    }
};

/**
 * Delete a product inventory release and restore the released inventory
 */
exports.delete = async (req, res) => {
    const { id } = req.params;
    const db = req.db;
    
    try {
        // Start a transaction
        await db.promise().beginTransaction();
        
        try {
            // Get the release to verify it exists
            const [releaseRows] = await db.promise().execute(
                `SELECT pir.*, p.product_name
                 FROM product_inventory_release pir
                 JOIN product p ON pir.product_id = p.product_id
                 WHERE pir.product_inventory_release_id = ?`,
                [id]
            );
            
            if (releaseRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product inventory release not found'
                });
            }
            
            const release = releaseRows[0];
            console.log(`Deleting product inventory release for product: ${release.product_name}, quantity: ${release.quantity}`);
            
            // Get release items
            const [releaseItems] = await db.promise().execute(
                `SELECT piri.*, ii.item_name
                 FROM product_inventory_release_items piri
                 JOIN inventory_item ii ON piri.item_id = ii.item_id
                 WHERE piri.product_inventory_release_id = ?`,
                [id]
            );
            
            // Restore all released inventory
            for (const item of releaseItems) {
                // Return the quantity back to the inventory stock
                const [updateResult] = await db.promise().execute(
                    `UPDATE inventory_stock 
                     SET quantity_available = quantity_available + ? 
                     WHERE stock_id = ?`,
                    [item.quantity, item.stock_id]
                );
                
                if (updateResult.affectedRows === 0) {
                    throw new Error(`Failed to restore inventory for stock ID ${item.stock_id}`);
                }
                
                console.log(`Restored ${item.quantity} units of ${item.item_name} to stock ID ${item.stock_id}`);
            }
            
            // Delete from product_inventory_release_items first (foreign key constraint)
            await db.promise().execute(
                'DELETE FROM product_inventory_release_items WHERE product_inventory_release_id = ?',
                [id]
            );
            
            // Then delete from product_inventory_release
            await db.promise().execute(
                'DELETE FROM product_inventory_release WHERE product_inventory_release_id = ?',
                [id]
            );
            
            // Commit the transaction
            await db.promise().commit();
            
            res.status(200).json({
                success: true,
                message: "Product inventory release deleted and inventory restored successfully"
            });
            
        } catch (error) {
            // Rollback transaction on error
            await db.promise().rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('Error deleting product inventory release:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product inventory release',
            error: error.message
        });
    }
};

module.exports = exports; 