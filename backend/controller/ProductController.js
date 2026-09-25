require("dotenv").config();

// Create new product (Manager and Admin only)
exports.createProduct = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can create products" });
        }

        const {
            product_name,
            description,
            selling_price,
            category,
            unit,
            image_url,
            min_production_amount
        } = req.body;

        const db = req.db;

        // Validate selling price
        if (selling_price <= 0) {
            return res.status(400).json({ message: "Selling price must be greater than 0" });
        }

        // Validate minimum production amount
        if (min_production_amount !== undefined && min_production_amount <= 0) {
            return res.status(400).json({ message: "Minimum production amount must be greater than 0" });
        }

        // Check if product with same name already exists
        const [existingProduct] = await db.promise().execute(
            "SELECT * FROM product WHERE product_name = ?",
            [product_name]
        );

        if (existingProduct.length > 0) {
            return res.status(400).json({ 
                message: "❌ A product with this name already exists" 
            });
        }

        // Create product
        const [result] = await db.promise().execute(
            `INSERT INTO product (
                product_name, description, selling_price,
                category, unit, image_url, min_production_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [product_name, description, selling_price, category, unit, image_url, min_production_amount || null]
        );

        res.status(201).json({
            message: "✅ Product created successfully",
            product_id: result.insertId
        });
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const db = req.db;
        const showInactive = req.query.showInactive === 'true';
        
        const query = showInactive 
            ? "SELECT * FROM product ORDER BY category, product_name"
            : "SELECT * FROM product WHERE isActive = TRUE ORDER BY category, product_name";
            
        db.execute(
            query,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const db = req.db;

        db.execute(
            "SELECT * FROM product WHERE product_id = ?",
            [productId],
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "❌ Product not found" });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const db = req.db;

        db.execute(
            "SELECT * FROM product WHERE category = ? ORDER BY product_name",
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

// Update product (Manager and Admin only)
exports.updateProduct = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can update products" });
        }

        const { productId } = req.params;
        const db = req.db;

        // Check if product exists
        const [existingProduct] = await db.promise().execute(
            "SELECT * FROM product WHERE product_id = ?",
            [productId]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "❌ Product not found" });
        }

        // If only updating isActive status
        if (req.body.hasOwnProperty('isActive') && Object.keys(req.body).length === 1) {
            await db.promise().execute(
                "UPDATE product SET isActive = ? WHERE product_id = ?",
                [req.body.isActive, productId]
            );
            return res.status(200).json({ 
                message: `✅ Product ${req.body.isActive ? 'activated' : 'deactivated'} successfully` 
            });
        }

        // For full product update
        const {
            product_name,
            description,
            selling_price,
            category,
            unit,
            image_url,
            isActive,
            min_production_amount
        } = req.body;

        // Validate required fields for full update
        if (!product_name || !description || !selling_price || !category || !unit) {
            return res.status(400).json({ 
                message: "❌ All fields (product_name, description, selling_price, category, unit) are required" 
            });
        }

        // Validate selling price
        if (selling_price <= 0) {
            return res.status(400).json({ message: "Selling price must be greater than 0" });
        }

        // Validate minimum production amount if provided
        if (min_production_amount !== undefined && min_production_amount <= 0) {
            return res.status(400).json({ message: "Minimum production amount must be greater than 0" });
        }

        // Check if updated name would conflict with another product
        const [conflictProduct] = await db.promise().execute(
            "SELECT * FROM product WHERE product_name = ? AND product_id != ?",
            [product_name, productId]
        );

        if (conflictProduct.length > 0) {
            return res.status(400).json({ 
                message: "❌ Another product with this name already exists" 
            });
        }

        // Update all product fields
        await db.promise().execute(
            `UPDATE product 
             SET product_name = ?, 
                 description = ?, 
                 selling_price = ?,
                 category = ?, 
                 unit = ?, 
                 image_url = ?,
                 isActive = COALESCE(?, isActive),
                 min_production_amount = ?
             WHERE product_id = ?`,
            [product_name, description, selling_price, category, unit, image_url, isActive, min_production_amount || null, productId]
        );

        res.status(200).json({ message: "✅ Product updated successfully" });
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Deactivate product (Manager and Admin only)
exports.deactivateProduct = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only managers and admins can deactivate products" });
        }

        const { productId } = req.params;
        const db = req.db;

        // Check if product exists
        const [existingProduct] = await db.promise().execute(
            "SELECT * FROM product WHERE product_id = ?",
            [productId]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "❌ Product not found" });
        }

        // Deactivate product
        await db.promise().execute(
            "UPDATE product SET isActive = FALSE WHERE product_id = ?",
            [productId]
        );

        res.status(200).json({ message: "✅ Product deactivated successfully" });
    } catch (error) {
        console.error("Deactivate Product Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all product categories
exports.getAllCategories = async (req, res) => {
    try {
        const db = req.db;
        db.execute(
            "SELECT DISTINCT category FROM product ORDER BY category",
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                res.status(200).json(results.map(r => r.category));
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get product stock by product ID
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

        // Get stock information for the product
        db.execute(
            `SELECT ps.*, p.product_name 
             FROM product_stock ps
             JOIN product p ON ps.product_id = p.product_id
             WHERE ps.product_id = ?`,
            [productId],
            (err, results) => {
                if (err) return res.status(500).json({ 
                    message: "Server Error", 
                    error: err.message 
                });

                // If there's no stock record, return zero quantity
                if (results.length === 0) {
                    return res.status(200).json({
                        product_id: parseInt(productId),
                        product_name: product[0].product_name,
                        quantity_available: 0,
                        last_updated: null
                    });
                }

                res.status(200).json(results[0]);
            }
        );
    } catch (error) {
        console.error("Get Product Stock Error:", error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
}; 
// Get product names by IDs
exports.getProductNamesByIds = async (req, res) => {
    try {
        const { ids } = req.query;
        
        if (!ids) {
            return res.status(400).json({ message: "Product IDs are required" });
        }
        
        // Convert the comma-separated string to an array
        const productIds = ids.split(',').map(id => parseInt(id.trim()));
        
        const db = req.db;
        
        // Use placeholders for each ID in the query
        const placeholders = productIds.map(() => '?').join(',');
        
        db.execute(
            `SELECT product_id, product_name FROM product WHERE product_id IN (${placeholders})`,
            productIds,
            (err, results) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });
                
                // Convert to a map of id -> name for easier lookup
                const productMap = {};
                results.forEach(product => {
                    productMap[product.product_id] = product.product_name;
                });
                
                res.status(200).json(productMap);
            }
        );
    } catch (error) {
        console.error("Get Product Names Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};



