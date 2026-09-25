require("dotenv").config();


// Create a new sale
const createSale = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { items } = req.body;

        // Validate request body
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                message: "❌ Invalid request: items array is required and cannot be empty" 
            });
        }

        // Validate each item
        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ 
                    message: "❌ Each item must have a valid product_id and quantity greater than 0" 
                });
            }
        }

        const db = req.db;
        
        // Start transaction
        await db.promise().beginTransaction();
        
        try {
            // First create the sale record with 0 amount
            const [saleResult] = await db.promise().execute(
                'INSERT INTO sales (total_amount) VALUES (0)'
            );
            
            const sale_id = saleResult.insertId;
            let total_amount = 0;
            
            // Insert sale items and calculate total
            for (const item of items) {
                // Get product price
                const [product] = await db.promise().execute(
                    'SELECT selling_price, product_name FROM product WHERE product_id = ?',
                    [item.product_id]
                );
                
                if (!product[0]) {
                    throw new Error(`Product with ID ${item.product_id} not found`);
                }

                const unit_price = product[0].selling_price;
                const subtotal = unit_price * item.quantity;
                total_amount += subtotal;

                // Insert sale item
                await db.promise().execute(
                    'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [sale_id, item.product_id, item.quantity, unit_price, subtotal]
                );

                // 🆕 Deduct from product_stock after inserting sale item
                const [stockRows] = await db.promise().execute(
                    'SELECT stock_id, quantity_available FROM product_stock WHERE product_id = ? ORDER BY last_updated DESC LIMIT 1',
                    [item.product_id]
                );

                if (stockRows.length > 0) {
                    const currentStock = stockRows[0].quantity_available;
                    const newStock = currentStock - item.quantity;

                    if (newStock < 0) {
                        await db.promise().rollback();
                        return res.status(400).json({ 
                            message: `Not enough stock for product ID ${item.product_id}. Available: ${currentStock}, Requested: ${item.quantity}`
                        });
                    }

                    await db.promise().execute(
                        'UPDATE product_stock SET quantity_available = ?, last_updated = NOW() WHERE stock_id = ?',
                        [newStock, stockRows[0].stock_id]
                    );

                    console.log(`✅ Stock updated for product ID ${item.product_id}: ${currentStock} -> ${newStock}`);
                } else {
                    await db.promise().rollback();
                    return res.status(400).json({ 
                        message: `No stock record found for product ID ${item.product_id}`
                    });
                }
            }
            
            // Update the total amount in sales table
            await db.promise().execute(
                'UPDATE sales SET total_amount = ? WHERE sale_id = ?',
                [total_amount, sale_id]
            );
            
            // Commit transaction
            await db.promise().commit();
            
            res.status(201).json({
                message: "✅ Sale created successfully",
                sale_id: sale_id,
                total_amount: total_amount
            });
            
        } catch (error) {
            // Rollback transaction on error
            await db.promise().rollback();
            throw error;
        }
        
    } catch (error) {
        console.error("Create Sale Error:", error);
        res.status(500).json({ 
            message: "❌ " + (error.message || "Server Error"),
            error: error.message 
        });
    }
};


// Get all sales
const getAllSales = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const db = req.db;
        
        // Get all sales with total items count
        const [sales] = await db.promise().execute(`
            SELECT 
                s.*,
                COUNT(si.sale_item_id) as total_items,
                SUM(si.quantity) as total_quantity
            FROM sales s
            LEFT JOIN sale_items si ON s.sale_id = si.sale_id
            GROUP BY s.sale_id
            ORDER BY s.sale_date DESC
        `);
        
        res.status(200).json(sales);
    } catch (error) {
        console.error("Fetch Sales Error:", error);
        res.status(500).json({ 
            message: "❌ Failed to fetch sales",
            error: error.message 
        });
    }
};

// Get sale by ID with items
const getSaleById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { id } = req.params;
        const db = req.db;
        
        // Get sale details
        const [sale] = await db.promise().execute(
            'SELECT * FROM sales WHERE sale_id = ?',
            [id]
        );
        
        if (!sale[0]) {
            return res.status(404).json({ message: "❌ Sale not found" });
        }
        
        // Get sale items with product details
        const [items] = await db.promise().execute(`
            SELECT 
                si.*,
                p.product_name,
                p.category
            FROM sale_items si
            JOIN product p ON si.product_id = p.product_id
            WHERE si.sale_id = ?
            ORDER BY si.sale_item_id
        `, [id]);
        
        res.status(200).json({
            ...sale[0],
            items: items
        });
        
    } catch (error) {
        console.error("Fetch Sale Error:", error);
        res.status(500).json({ 
            message: "❌ Failed to fetch sale details",
            error: error.message 
        });
    }
};

// Get daily sales report
const getDailySalesReport = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        // Check if user is manager or admin
        if (!['manager', 'admin' , 'cashier'].includes(req.user.role)) {
            return res.status(403).json({ 
                message: "❌ Only managers and admins can access sales reports" 
            });
        }

        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ 
                message: "❌ Date parameter is required (YYYY-MM-DD)" 
            });
        }

        const db = req.db;
        
        // Get daily sales summary
        const [summary] = await db.promise().execute(`
            SELECT 
                DATE(sale_date) as sale_date,
                COUNT(sale_id) as total_sales,
                SUM(total_amount) as total_revenue,
                (
                    SELECT COUNT(sale_item_id) 
                    FROM sale_items si 
                    WHERE DATE(s.sale_date) = DATE(?)
                    AND si.sale_id = s.sale_id
                ) as total_items_sold
            FROM sales s
            WHERE DATE(sale_date) = ?
            GROUP BY DATE(sale_date)
        `, [date, date]);
        
        // Get product-wise sales for the day
        const [products] = await db.promise().execute(`
            SELECT 
                p.product_name,
                p.category,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_amount
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.sale_id
            JOIN product p ON si.product_id = p.product_id
            WHERE DATE(s.sale_date) = ?
            GROUP BY si.product_id
            ORDER BY total_amount DESC
        `, [date]);
        
        res.status(200).json({
            summary: summary[0] || {
                sale_date: date,
                total_sales: 0,
                total_revenue: 0,
                total_items_sold: 0
            },
            products: products
        });
        
    } catch (error) {
        console.error("Sales Report Error:", error);
        res.status(500).json({ 
            message: "❌ Failed to generate sales report",
            error: error.message 
        });
    }
};

// Get detailed sales statistics (Admin only)
const getSalesStatistics = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const db = req.db;
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE s.sale_date BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        // Get overall sales statistics
        const [overallStats] = await db.promise().execute(`
            SELECT 
                COUNT(DISTINCT s.sale_id) as total_sales,
                SUM(s.total_amount) as total_revenue,
                AVG(s.total_amount) as average_sale_amount,
                COUNT(DISTINCT si.product_id) as unique_products_sold,
                SUM(si.quantity) as total_items_sold
            FROM sales s
            JOIN sale_items si ON s.sale_id = si.sale_id
            ${dateFilter}
        `, params);

        // Get product performance
        const [productStats] = await db.promise().execute(`
            SELECT 
                p.product_id,
                p.product_name,
                p.category,
                COUNT(DISTINCT s.sale_id) as times_sold,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue,
                AVG(si.unit_price) as average_price
            FROM sales s
            JOIN sale_items si ON s.sale_id = si.sale_id
            JOIN product p ON si.product_id = p.product_id
            ${dateFilter}
            GROUP BY p.product_id
            ORDER BY total_revenue DESC
            LIMIT 10
        `, params);

        // Get hourly sales distribution
        const [hourlyStats] = await db.promise().execute(`
            SELECT 
                HOUR(s.sale_date) as hour,
                COUNT(*) as total_sales,
                SUM(s.total_amount) as total_revenue
            FROM sales s
            ${dateFilter}
            GROUP BY HOUR(s.sale_date)
            ORDER BY hour
        `, params);

        // Get category performance
        const [categoryStats] = await db.promise().execute(`
            SELECT 
                p.category,
                COUNT(DISTINCT s.sale_id) as total_sales,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue
            FROM sales s
            JOIN sale_items si ON s.sale_id = si.sale_id
            JOIN product p ON si.product_id = p.product_id
            ${dateFilter}
            GROUP BY p.category
            ORDER BY total_revenue DESC
        `, params);

        res.status(200).json({
            success: true,
            statistics: {
                overall: overallStats[0],
                topProducts: productStats,
                hourlyDistribution: hourlyStats,
                categoryPerformance: categoryStats
            }
        });
    } catch (error) {
        console.error('Error generating sales statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate sales statistics',
            error: error.message
        });
    }
};

// Get detailed sales list with filters (Admin only)
const getDetailedSales = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const db = req.db;
        const { startDate, endDate, category, minAmount, maxAmount } = req.query;

        let conditions = [];
        let params = [];

        if (startDate && endDate) {
            conditions.push('s.sale_date BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }

        if (category) {
            conditions.push('p.category = ?');
            params.push(category);
        }

        if (minAmount) {
            conditions.push('s.total_amount >= ?');
            params.push(minAmount);
        }

        if (maxAmount) {
            conditions.push('s.total_amount <= ?');
            params.push(maxAmount);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Get filtered sales with items
        const [sales] = await db.promise().execute(`
            SELECT DISTINCT
                s.*,
                COUNT(si.sale_item_id) as total_items,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'product_name', p.product_name,
                        'quantity', si.quantity,
                        'unit_price', si.unit_price,
                        'subtotal', si.subtotal,
                        'category', p.category
                    ) SEPARATOR '|||'
                ) as items_detail
            FROM sales s
            JOIN sale_items si ON s.sale_id = si.sale_id
            JOIN product p ON si.product_id = p.product_id
            ${whereClause}
            GROUP BY s.sale_id
            ORDER BY s.sale_date DESC
        `, params);

        // Format the response
        const formattedSales = sales.map(sale => ({
            ...sale,
            items_detail: sale.items_detail ? sale.items_detail.split('|||').map(item => JSON.parse(item)) : []
        }));

        res.status(200).json({
            success: true,
            sales: formattedSales
        });
    } catch (error) {
        console.error('Error fetching detailed sales:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch detailed sales',
            error: error.message
        });
    }
};

// Get detailed sale information by ID
const getSaleDetails = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { id } = req.params;
        const db = req.db;
        
        // Get sale details with product information
        const [saleDetails] = await db.promise().execute(`
            SELECT 
                s.*,
                (
                    SELECT GROUP_CONCAT(
                        JSON_OBJECT(
                            'product_name', p.product_name,
                            'quantity', si.quantity,
                            'unit_price', si.unit_price,
                            'subtotal', si.subtotal,
                            'category', p.category
                        )
                    )
                    FROM sale_items si
                    JOIN product p ON si.product_id = p.product_id
                    WHERE si.sale_id = s.sale_id
                ) as sale_items
            FROM sales s
            WHERE s.sale_id = ?
        `, [id]);

        if (!saleDetails[0]) {
            return res.status(404).json({ 
                success: false,
                message: 'Sale not found' 
            });
        }

        // Parse the sale items JSON string
        if (saleDetails[0].sale_items) {
            try {
                // Split by comma but handle escaped commas within JSON
                const itemStrings = saleDetails[0].sale_items.match(/({[^}]+})/g) || [];
                const itemsArray = itemStrings.map(item => JSON.parse(item.trim()));
                saleDetails[0].sale_items = itemsArray;
            } catch (error) {
                console.error('Error parsing sale items:', error);
                saleDetails[0].sale_items = [];
            }
        } else {
            saleDetails[0].sale_items = [];
        }

        res.json({
            success: true,
            sale: saleDetails[0]
        });
    } catch (error) {
        console.error('Error fetching sale details:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching sale details',
            error: error.message 
        });
    }
};

// Get sales by date range
const getSalesByDateRange = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found in request" });
        }

        const { startDate, endDate } = req.query;

        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "❌ Both startDate and endDate are required"
            });
        }

        const db = req.db;

        // Get sales within date range with detailed information
        const [sales] = await db.promise().execute(`
            SELECT 
                s.*,
                COUNT(si.sale_item_id) as total_items,
                SUM(si.quantity) as total_quantity
            FROM sales s
            LEFT JOIN sale_items si ON s.sale_id = si.sale_id
            WHERE DATE(s.sale_date) BETWEEN ? AND ?
            GROUP BY s.sale_id
            ORDER BY s.sale_date DESC
        `, [startDate, endDate]);

        // Calculate summary statistics
        const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
        const saleCount = sales.length;
        const totalItems = sales.reduce((sum, sale) => sum + parseInt(sale.total_items), 0);
        const totalQuantity = sales.reduce((sum, sale) => sum + parseInt(sale.total_quantity), 0);

        // Get product-wise summary
        const [productSummary] = await db.promise().execute(`
            SELECT 
                p.product_name,
                p.category,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_amount,
                COUNT(DISTINCT s.sale_id) as appearance_in_sales
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.sale_id
            JOIN product p ON si.product_id = p.product_id
            WHERE DATE(s.sale_date) BETWEEN ? AND ?
            GROUP BY si.product_id
            ORDER BY total_amount DESC
        `, [startDate, endDate]);

        res.status(200).json({
            success: true,
            data: {
                sales,
                summary: {
                    totalAmount,
                    saleCount,
                    totalItems,
                    totalQuantity,
                    averageOrderValue: saleCount > 0 ? totalAmount / saleCount : 0
                },
                productSummary
            }
        });

    } catch (error) {
        console.error("Fetch Sales by Date Range Error:", error);
        res.status(500).json({
            success: false,
            message: "❌ Failed to fetch sales data",
            error: error.message
        });
    }
};

// Get all sales with detailed information for admin
const getAllSalesForAdmin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: "❌ Access denied. Admin only." });
        }

        const db = req.db;
        
        // Get all sales with detailed information
        const [sales] = await db.promise().execute(`
            SELECT 
                s.*,
                COUNT(si.sale_item_id) as total_items,
                SUM(si.quantity) as total_quantity,
                GROUP_CONCAT(DISTINCT p.product_name) as products
            FROM sales s
            LEFT JOIN sale_items si ON s.sale_id = si.sale_id
            LEFT JOIN product p ON si.product_id = p.product_id
            GROUP BY s.sale_id
            ORDER BY s.sale_date DESC
        `);

        // Get items for each sale
        const salesWithDetails = await Promise.all(sales.map(async (sale) => {
            // Get sale items with product details
            const [items] = await db.promise().execute(`
                SELECT 
                    si.*,
                    p.product_name,
                    p.category,
                    p.image_url
                FROM sale_items si
                JOIN product p ON si.product_id = p.product_id
                WHERE si.sale_id = ?
            `, [sale.sale_id]);

            return {
                ...sale,
                items: items
            };
        }));

        res.status(200).json({
            success: true,
            message: "✅ Sales fetched successfully",
            data: salesWithDetails
        });
        
    } catch (error) {
        console.error("Fetch Admin Sales Error:", error);
        res.status(500).json({ 
            success: false,
            message: "❌ Failed to fetch sales details",
            error: error.message 
        });
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
    getDailySalesReport,
    getSalesStatistics,
    getDetailedSales,
    getSaleDetails,
    getSalesByDateRange,
    getAllSalesForAdmin
}; 