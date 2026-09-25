const util = require('util');
const checkInventoryForProduction = async (db, items) => {
    try {
        console.log('Starting inventory check for items:', JSON.stringify(items, null, 2));
        const inventoryCheck = [];
        
        // Process each ordered item
        for (const item of items) {
            console.log(`Checking product ID ${item.product_id} for quantity ${item.quantity}`);
            
            // First get the product details
            const [productRows] = await new Promise((resolve, reject) => {
                db.execute(
                    'SELECT product_id, product_name FROM product WHERE product_id = ?',
                    [item.product_id],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            if (productRows.length === 0) {
                console.warn(`Product not found: ${item.product_id}`);
                inventoryCheck.push({
                    error: true,
                    product_id: item.product_id,
                    message: "Product not found"
                });
                continue;
            }

            const product = productRows[0];

            // Get recipe items for this product
            const [recipeRows] = await new Promise((resolve, reject) => {
                db.execute(
                    `SELECT r.ingredient_item_id, r.quantity_required_per_unit,
                            ii.item_name, ii.restock_level
                     FROM recipe r
                     JOIN inventory_item ii ON r.ingredient_item_id = ii.item_id
                     WHERE r.product_item_id = ?`,
                    [item.product_id],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            if (recipeRows.length === 0) {
                console.warn(`No recipe found for product: ${product.product_name}`);
                inventoryCheck.push({
                    error: true,
                    product_id: item.product_id,
                    product_name: product.product_name,
                    message: "No recipe found for this product"
                });
                continue;
            }

            // Check inventory levels for each ingredient
            for (const recipe of recipeRows) {
                // Get total stock for this ingredient across all inventory stocks
                const [stockRows] = await new Promise((resolve, reject) => {
                    db.execute(
                        `SELECT COALESCE(SUM(inv_stock.quantity_available), 0) as current_stock
                         FROM inventory_stock inv_stock
                         WHERE inv_stock.item_id = ?`,
                        [recipe.ingredient_item_id],
                        (err, results) => {
                            if (err) reject(err);
                            else resolve([results]);
                        }
                    );
                });

                const currentStock = stockRows[0].current_stock;
                const requiredQuantity = item.quantity * recipe.quantity_required_per_unit;
                const availableAboveRestock = Math.max(0, currentStock - recipe.restock_level);

                console.log(`Checking ingredient ${recipe.item_name}:`, {
                    required: requiredQuantity,
                    available: currentStock,
                    availableAboveRestock,
                    restock_level: recipe.restock_level
                });

                if (requiredQuantity > availableAboveRestock) {
                    inventoryCheck.push({
                        product_id: item.product_id,
                        product_name: product.product_name,
                        ingredient_id: recipe.ingredient_item_id,
                        ingredient_name: recipe.item_name,
                        required_quantity: requiredQuantity,
                        available_quantity: currentStock,
                        restock_level: recipe.restock_level,
                        shortage: requiredQuantity - availableAboveRestock
                    });
                }
            }
        }

        console.log('Inventory check results:', JSON.stringify(inventoryCheck, null, 2));
        return inventoryCheck;
    } catch (error) {
        console.error('Error in checkInventoryForProduction:', error);
        throw error;
    }
};

// const createOrder = async (req, res) => {
//     const db = req.db;
    
//     try {
//         const { items, shipping_address, order_type = 'DIRECT_SALE' } = req.body;
//         const user_id = req.user.user_id;

//         // For production orders, check inventory availability
//         if (order_type === 'PRODUCTION_ORDER') {
//             console.log('Processing production order, checking inventory...');
//             const inventoryCheck = await checkInventoryForProduction(db, items);
            
//             // Check for errors in recipe lookup
//             const recipeErrors = inventoryCheck.filter(check => check.error);
//             if (recipeErrors.length > 0) {
//                 console.error('Recipe errors found:', recipeErrors);
//                 return res.status(400).json({
//                     message: "Recipe configuration error",
//                     errors: recipeErrors
//                 });
//             }

//             // Check for inventory shortages
//             const shortages = inventoryCheck.filter(check => !check.error);
//             if (shortages.length > 0) {
//                 console.warn('Inventory shortages found:', shortages);
//                 return res.status(400).json({
//                     message: "Insufficient inventory above restock levels",
//                     shortages: shortages
//                 });
//             }

//             console.log('Inventory check passed successfully');
//         }

//         await db.promise().beginTransaction();

//         try {
//             // Calculate total amount
//             let total_amount = 0;
//             for (const item of items) {
//                 const [rows] = await db.promise().execute(
//                     'SELECT selling_price FROM product WHERE product_id = ?',
//                     [item.product_id]
//                 );
//                 if (rows.length > 0) {
//                     total_amount += rows[0].selling_price * item.quantity;
//                 }
//             }

//             // Create order
//             const [orderResult] = await db.promise().execute(
//                 'INSERT INTO orders (user_id, order_type, order_status, date, address, total_amount) VALUES (?, ?, ?, NOW(), ?, ?)',
//                 [user_id, order_type, 'PENDING', JSON.stringify(shipping_address), total_amount]
//             );

//             const order_id = orderResult.insertId;

//             // Insert order items
//             for (const item of items) {
//                 await db.promise().execute(
//                     'INSERT INTO order_product (order_id, product_id, quantity) VALUES (?, ?, ?)',
//                     [order_id, item.product_id, item.quantity]
//                 );
//             }

//             // If it's a production order, create pending inventory release records
//             if (order_type === 'PRODUCTION_ORDER') {
//                 for (const item of items) {
//                     // Get recipe for the product
//                     const [recipeRows] = await db.promise().execute(
//                         `SELECT r.*, ii.item_name 
//                          FROM recipe r 
//                          JOIN inventory_item ii ON r.ingredient_item_id = ii.item_id 
//                          WHERE r.product_item_id = ?`,
//                         [item.product_id]
//                     );

//                     if (recipeRows.length === 0) {
//                         throw new Error(`No recipe found for product ID: ${item.product_id}`);
//                     }

//                     // Create inventory releases for each ingredient with pending status
//                     for (const recipe of recipeRows) {
//                         const requiredQuantity = item.quantity * recipe.quantity_required_per_unit;
//                         console.log(`Creating pending inventory release for ${recipe.item_name}:`, {
//                             order_id,
//                             ingredient_id: recipe.ingredient_item_id,
//                             quantity: requiredQuantity
//                         });
                        
//                         // Create inventory release with pending status
//                         await db.promise().execute(
//                             'INSERT INTO inventory_release (order_id, item_id, quantity, date_time, status) VALUES (?, ?, ?, NOW(), ?)',
//                             [order_id, recipe.ingredient_item_id, requiredQuantity, 'pending']
//                         );
//                     }
//                 }
//             }

//             await db.promise().commit();
//             res.status(201).json({
//                 message: "Order created successfully",
//                 order_id: order_id
//             });
//         } catch (error) {
//             await db.promise().rollback();
//             throw error;
//         }
//     } catch (error) {
//         console.error('Error creating order:', error);
//         res.status(500).json({ message: 'Error creating order', error: error.message });
//     }
// };

const getAllOrders = async (req, res) => {
    const db = req.db;
    const user_id = req.user.user_id;
    
    try {
        // Get all orders for the user
        const [orders] = await db.promise().execute(
            'SELECT o.*, p.payment_status, p.payment_method FROM orders o LEFT JOIN payments p ON o.order_id = p.order_id WHERE o.user_id = ?',
            [user_id]
        );

        // Get items for all orders
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [itemRows] = await db.promise().execute(
                'SELECT op.*, p.product_name, p.image_url FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
                [order.order_id]
            );

            // If it's a production order, get inventory releases
            let inventoryReleases = [];
            if (order.order_type === 'PRODUCTION_ORDER') {
                const [releaseRows] = await db.promise().execute(
                    `SELECT ir.*, ii.item_name, ii.unit 
                     FROM inventory_release ir 
                     JOIN inventory_item ii ON ir.item_id = ii.item_id 
                     WHERE ir.order_id = ?`,
                    [order.order_id]
                );
                inventoryReleases = releaseRows;
            }

            return {
                ...order,
                items: itemRows,
                inventory_releases: inventoryReleases,
                shipping_address: order.address ? JSON.parse(order.address) : null
            };
        }));

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

const getOrder = async (req, res) => {
    const db = req.db;
  
    try {
      const { orderId } = req.query; // ✅ FROM QUERY PARAM
      const user_id = req.user.user_id;
  
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }
  
      // Fetch specific order for this user
      const [orderRows] = await db.promise().execute(
        'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
        [orderId, user_id]
      );
  
      if (orderRows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      const order = orderRows[0];
  
      // Parse address if it's JSON string
      try {
        order.shipping_address = JSON.parse(order.address);
      } catch (e) {
        order.shipping_address = null;
      }
  
      // Get order items
      const [itemRows] = await db.promise().execute(
        'SELECT op.*, p.product_name, p.image_url FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
        [orderId]
      );
  
      // Get inventory releases if it's a production order
      let inventoryReleases = [];
      if (order.order_type === 'PRODUCTION_ORDER') {
        const [releaseRows] = await db.promise().execute(
          `SELECT ir.*, ii.item_name, ii.unit 
           FROM inventory_release ir 
           JOIN inventory_item ii ON ir.item_id = ii.item_id 
           WHERE ir.order_id = ?`,
          [orderId]
        );
        inventoryReleases = releaseRows;
      }
  
      res.json({
        ...order,
        items: itemRows,
        inventory_releases: inventoryReleases
      });
  
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
  };
  

const getUserOrders = async (req, res) => {
    const db = req.db;
    
    try {
        const user_id = req.user.user_id;

        // Get orders with payment status but without production_orders join
        const [orders] = await db.promise().execute(
            `SELECT o.*, p.payment_status
             FROM orders o 
             LEFT JOIN payments p ON o.order_id = p.order_id 
             WHERE o.user_id = ?
             ORDER BY o.date DESC`,
            [user_id]
        );

        // Get items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await db.promise().execute(
                'SELECT op.*, p.product_name, p.image_url, p.selling_price as price FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
                [order.order_id]
            );

            return {
                ...order,
                items,
                shipping_address: order.address ? JSON.parse(order.address) : null
            };
        }));

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Error fetching user orders', error: error.message });
    }
};

// const checkInventoryStatus = async (req, res) => {
//     try {
//         const { product_id } = req.params;
//         const db = req.db;

//         console.log("Ado meka ain krnna epa S")
//         const [results] = await db.promise().execute(
//             `SELECT 
//                 r.ingredient_item_id,
//                 ii.item_name,
//                 SUM(inv_stock.quantity_available) AS total_available_stock,
//                 (r.quantity_required_per_unit) AS required_per_unit,
//                 ii.restock_level,
//                 CASE 
//                     WHEN SUM(inv_stock.quantity_available) >= r.quantity_required_per_unit 
//                          AND (SUM(inv_stock.quantity_available) - r.quantity_required_per_unit) >= ii.restock_level
//                     THEN 'Sufficient'
//                     ELSE 'Insufficient'
//                 END AS stock_status
//             FROM recipe r
//             JOIN inventory_item ii ON r.ingredient_item_id = ii.item_id
//             JOIN inventory_stock inv_stock ON r.ingredient_item_id = inv_stock.item_id
//             WHERE r.product_item_id = ?
//             GROUP BY r.ingredient_item_id, ii.item_name, r.quantity_required_per_unit, ii.restock_level`,
//             [product_id]
//         );

//         return res.json({
//             success: true,
//             data: results
//         });
//     } catch (error) {
//         console.error('Error checking inventory status:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: error.message
//         });
//     }
// };

// const processInventoryAfterPayment = async (req, res) => {
//     const db = req.db;
//     const order_id = req.params.id;

//     // Validate order_id
//     if (!order_id) {
//         return res.status(400).json({
//             success: false,
//             message: 'Order ID is required'
//         });
//     }

//     console.log('Processing inventory after payment for order:', order_id);

//     try {
//         // Start a transaction
//         await db.promise().beginTransaction();

//         try {
//             // 1. Get all pending inventory releases for this order
//             console.log('Fetching releases for order_id:', order_id);
//             const [releases] = await db.promise().execute(
//                 `SELECT ir.*, ii.item_name 
//                  FROM inventory_release ir
//                  JOIN inventory_item ii ON ir.item_id = ii.item_id
//                  WHERE ir.order_id = ? AND ir.status = 'pending'`,
//                 [order_id]
//             );

//             console.log('Found releases:', releases);

//             if (releases.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'No pending inventory releases found for this order'
//                 });
//             }

//             // Track processed release IDs to prevent double processing
//             const processedReleases = new Set();

//             // 2. Process each release
//             for (const release of releases) {
//                 console.log('Processing release:', release);
                
//                 // Skip if this release has already been processed
//                 if (processedReleases.has(release.release_id)) {
//                     console.log(`Skipping already processed release ${release.release_id} for item ${release.item_name}`);
//                     continue;
//                 }

//                 // Validate release data
//                 if (!release.item_id || !release.quantity) {
//                     console.error('Invalid release data:', release);
//                     continue;
//                 }

//                 // Get available stock for this item
//                 console.log('Fetching stock for item_id:', release.item_id);
//                 const [stockRows] = await db.promise().execute(
//                     `SELECT inv.stock_id, inv.quantity_available, p.purchase_date 
//                      FROM inventory_stock inv
//                      JOIN purchase p ON inv.purchase_id = p.purchase_id
//                      WHERE inv.item_id = ? AND inv.quantity_available > 0
//                      ORDER BY p.purchase_date ASC`,
//                     [release.item_id]
//                 );

//                 console.log('Found stock rows:', stockRows);

//                 let remainingQuantity = release.quantity;
//                 let stockIndex = 0;

//                 // Update stock using FIFO until we have enough quantity
//                 while (remainingQuantity > 0 && stockIndex < stockRows.length) {
//                     const stock = stockRows[stockIndex];
//                     const deductAmount = Math.min(remainingQuantity, stock.quantity_available);
                    
//                     // Only deduct if there's actual quantity to deduct
//                     if (deductAmount > 0) {
//                         // Update the stock with a check to prevent over-deduction
//                         const [updateResult] = await db.promise().execute(
//                             `UPDATE inventory_stock 
//                              SET quantity_available = quantity_available - ? 
//                              WHERE stock_id = ? AND quantity_available >= ?`,
//                             [deductAmount, stock.stock_id, deductAmount]
//                         );

//                         // Only reduce remaining quantity if update was successful
//                         if (updateResult.affectedRows > 0) {
//                             remainingQuantity -= deductAmount;
//                             console.log(`Deducted ${deductAmount} from stock_id ${stock.stock_id} for item ${release.item_name} (purchase date: ${stock.purchase_date})`);
//                         }
//                     }
                    
//                     stockIndex++;
//                 }

//                 // Check if we couldn't fulfill the entire quantity
//                 if (remainingQuantity > 0) {
//                     console.error(`Insufficient stock for item ${release.item_name}. Still need ${remainingQuantity} more units.`);
//                     throw new Error(`Insufficient stock for item ${release.item_name}`);
//                 }

//                 // Update release status only after successful deduction
//                 await db.promise().execute(
//                     'UPDATE inventory_release SET status = ? WHERE release_id = ? AND status = ?',
//                     ['released', release.release_id, 'pending']
//                 );

//                 // Mark this release as processed
//                 processedReleases.add(release.release_id);
//             }

//             // 5. Update order status to PROCESSING
//             console.log('Updating order status to PROCESSING for order_id:', order_id);
//             await db.promise().execute(
//                 'UPDATE orders SET order_status = ? WHERE order_id = ?',
//                 ['PROCESSING', order_id]
//             );

//             // Commit the transaction
//             await db.promise().commit();

//             res.status(200).json({
//                 success: true,
//                 message: 'Inventory processed successfully'
//             });

//         } catch (error) {
//             // Rollback the transaction if any error occurs
//             await db.promise().rollback();
//             console.error('Transaction error:', error);
//             throw error;
//         }

//     } catch (error) {
//         console.error('Error processing inventory:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error processing inventory',
//             error: error.message
//         });
//     }
// };

// const completeOrder = async (req, res) => {
//     const db = req.db;
//     const order_id = req.params.id;
//     const { payment_intent_id } = req.body;

//     try {
//         // Update order status to completed
//         await db.promise().execute(
//             'UPDATE orders SET order_status = ? WHERE order_id = ?',
//             ['COMPLETED', order_id]
//         );

//         // Update payment status if payment_intent_id is provided
//         if (payment_intent_id) {
//             await db.promise().execute(
//                 'UPDATE payments SET payment_status = ? WHERE order_id = ?',
//                 ['completed', order_id]
//             );
//         }

//         res.json({
//             success: true,
//             message: 'Order completed successfully'
//         });
//     } catch (error) {
//         console.error('Error completing order:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error completing order',
//             error: error.message
//         });
//     }
// };

// const processInventory = async (req, res) => {
//     const db = req.db;
//     const order_id = req.params.id;

//     console.log('==================================================');
//     console.log('PROCESS INVENTORY FUNCTION CALLED');
//     console.log('Request params:', req.params);
//     console.log('Request body:', req.body);
//     console.log('Request user:', req.user ? req.user.user_id : 'No user');
//     console.log('==================================================');

//     try {
//         console.log(`Processing inventory for order ${order_id}`);
        
//         // Get order details
//         const [orderRows] = await db.promise().execute(
//             'SELECT * FROM orders WHERE order_id = ?',
//             [order_id]
//         );

//         if (orderRows.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Order not found'
//             });
//         }

//         const order = orderRows[0];

//         // Only process for production orders
//         if (order.order_type !== 'PRODUCTION_ORDER') {
//             return res.json({
//                 success: true,
//                 message: 'Not a production order, no inventory processing needed'
//             });
//         }

//         // Get order items
//         const [orderItems] = await db.promise().execute(
//             'SELECT op.*, p.product_name FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
//             [order_id]
//         );
        
//         console.log(`Found ${orderItems.length} items in the order`);

//         // Get all inventory releases for this order
//         const [inventoryReleases] = await db.promise().execute(
//             'SELECT * FROM inventory_release WHERE order_id = ?',
//             [order_id]
//         );
        
//         console.log(`Found ${inventoryReleases.length} pending inventory releases for order ${order_id}`);

//         // Process each inventory release
//         for (const release of inventoryReleases) {
//             console.log(`Processing inventory release ID ${release.release_id} for item ID ${release.item_id}`);
            
//             // Check if we have enough stock
//             const [stockRows] = await db.promise().execute(
//                 `SELECT COALESCE(SUM(quantity_available), 0) as total_available
//                  FROM inventory_stock 
//                  WHERE item_id = ?`,
//                 [release.item_id]
//             );

//             const totalAvailable = stockRows[0].total_available;
//             let status = 'pending';
                
//             console.log(`Required: ${release.quantity}, Available: ${totalAvailable}`);

//             if (totalAvailable >= release.quantity) {
//                 // Update inventory stock using FIFO
//                 const [oldestStockRows] = await db.promise().execute(
//                     `SELECT inv_stock.stock_id, inv_stock.quantity_available, p.purchase_date 
//                      FROM inventory_stock inv_stock
//                      JOIN purchase p ON inv_stock.purchase_id = p.purchase_id
//                      WHERE inv_stock.item_id = ? AND inv_stock.quantity_available > 0
//                      ORDER BY p.purchase_date ASC`,
//                     [release.item_id]
//                 );

//                 let remainingQuantity = release.quantity;
//                 for (const stock of oldestStockRows) {
//                     if (remainingQuantity <= 0) break;

//                     const deductAmount = Math.min(remainingQuantity, stock.quantity_available);
                    
//                     // Update this specific inventory stock
//                     await db.promise().execute(
//                         `UPDATE inventory_stock 
//                          SET quantity_available = quantity_available - ? 
//                          WHERE stock_id = ?`,
//                         [deductAmount, stock.stock_id]
//                     );

//                     remainingQuantity -= deductAmount;
//                     console.log(`Deducted ${deductAmount} from stock_id ${stock.stock_id} (purchase date: ${stock.purchase_date})`);
//                 }

//                 status = 'released';
//                 console.log(`Released ${release.quantity} units from inventory`);
//             } else {
//                 status = 'not released';
//                 console.log(`Could not release ${release.quantity} units - insufficient stock`);
//             }

//             // Update the inventory release record status
//             await db.promise().execute(
//                 'UPDATE inventory_release SET status = ? WHERE release_id = ?',
//                 [status, release.release_id]
//             );
            
//             console.log(`Updated inventory release ${release.release_id} status to ${status}`);
//         }

//         // Update order status to PROCESSING
//         await db.promise().execute(
//             'UPDATE orders SET order_status = ? WHERE order_id = ?',
//             ['PROCESSING', order_id]
//         );

//         console.log(`Inventory processing completed for order ${order_id}`);
//         res.json({
//             success: true,
//             message: 'Inventory processed successfully'
//         });
//     } catch (error) {
//         console.error('Error processing inventory:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error processing inventory',
//             error: error.message
//         });
//     }
// };

const { sendOrderConfirmation } = require('../utils/emailService');

const handleOrderFlow = async (req, res) => {
    const db = req.db;
    const { items, shipping_address, order_type = 'DIRECT_SALE', date, payment_method = 'CARD' } = req.body;
    const user_id = req.user.user_id;
    console.log('🧪 Inserting Order With:', {
        user_id,
        order_type,
        date,
        address: JSON.stringify(shipping_address),
        payment_method
    });

    try {
        if (order_type === 'PRODUCTION_ORDER') {
            const inventoryCheck = await checkInventoryForProduction(db, items);

            const recipeErrors = inventoryCheck.filter(check => check.error);
            if (recipeErrors.length > 0) {
                return res.status(400).json({
                    message: "Recipe configuration error",
                    errors: recipeErrors
                });
            }

            const shortages = inventoryCheck.filter(check => !check.error);
            if (shortages.length > 0) {
                return res.status(400).json({
                    message: "Insufficient inventory above restock levels",
                    shortages: shortages
                });
            }

            console.log('✅ Inventory check passed');
        }

        await db.promise().beginTransaction();

        try {
            // 1. Create order
            let total_amount = 0;
            
            // Create an array to store items with product details for email
            let orderItemsWithDetails = [];
            
            for (const item of items) {
                const [rows] = await db.promise().execute(
                    'SELECT product_id, product_name, selling_price FROM product WHERE product_id = ?',
                    [item.product_id]
                );
                if (rows.length > 0) {
                    total_amount += rows[0].selling_price * item.quantity;
                    
                    // Add item details to our array for the email
                    orderItemsWithDetails.push({
                        product_id: rows[0].product_id,
                        product_name: rows[0].product_name,
                        quantity: item.quantity,
                        unit_price: rows[0].selling_price
                    });
                }
            }
            
            console.log('🧪 Inserting Order With:', {
                user_id,
                order_type,
                date,
                address: JSON.stringify(shipping_address),
                total_amount,
                payment_method
            });
            
            const [orderResult] = await db.promise().execute(
                'INSERT INTO orders (user_id, order_type, order_status, date, address, total_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user_id, order_type, 'PENDING', date, JSON.stringify(shipping_address), total_amount, payment_method]
            );
            const order_id = orderResult.insertId;

            // 2. Insert order items and (for DIRECT_SALE) deduct stock
            for (const item of items) {
                // Insert order-product relationship
                await db.promise().execute(
                    'INSERT INTO order_product (order_id, product_id, quantity) VALUES (?, ?, ?)',
                    [order_id, item.product_id, item.quantity]
                );

                // 🆕 Handle stock deduction if order_type is DIRECT_SALE
                if (order_type === 'DIRECT_SALE') {
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

                        // Update product_stock
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
            }

            // 3. Insert inventory_release entries as pending (only for PRODUCTION_ORDER)
            if (order_type === 'PRODUCTION_ORDER') {
                for (const item of items) {
                    const [recipeRows] = await db.promise().execute(
                        `SELECT r.*, ii.item_name 
                         FROM recipe r 
                         JOIN inventory_item ii ON r.ingredient_item_id = ii.item_id 
                         WHERE r.product_item_id = ?`,
                        [item.product_id]
                    );

                    for (const recipe of recipeRows) {
                        const requiredQty = item.quantity * recipe.quantity_required_per_unit;

                        await db.promise().execute(
                            `INSERT INTO inventory_release 
                             (order_id, item_id, quantity, date_time, status)
                             VALUES (?, ?, ?, NOW(), 'pending')`,
                            [order_id, recipe.ingredient_item_id, requiredQty]
                        );

                        console.log(`📝 Pending release added for ${recipe.item_name}, Qty: ${requiredQty}`);
                    }
                }
            }

            // Get user information for email
            const [userData] = await db.promise().execute(
                'SELECT email, first_name, last_name FROM user WHERE user_id = ?',
                [user_id]
            );

            await db.promise().commit();

            // Send order confirmation email
            if (userData.length > 0 && userData[0].email) {
                try {
                    await sendOrderConfirmation({
                        email: userData[0].email,
                        name: `${userData[0].first_name} ${userData[0].last_name}`,
                        items: orderItemsWithDetails,
                        total: total_amount,
                        orderId: order_id,
                        orderType: order_type
                    });
                    console.log(`✅ Order confirmation email sent to ${userData[0].email}`);
                } catch (emailError) {
                    // Don't fail the order if email fails
                    console.error('❌ Error sending order confirmation email:', emailError);
                }
            }

            res.status(201).json({
                message: "Order created successfully",
                order_id,
                total_amount
            });

        } catch (error) {
            await db.promise().rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error in order flow:', error);
        res.status(500).json({ message: 'Order creation failed', error: error.message });
    }
};



const getRecentProductionOrders = async (req, res) => {
    const db = req.db;
    
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get production orders from the last 24 hours without user join
        const [orders] = await db.promise().execute(
            `SELECT o.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'product_id', op.product_id,
                            'quantity', op.quantity,
                            'product_name', p.product_name
                        )
                    ) as items
             FROM orders o
             JOIN order_product op ON o.order_id = op.order_id
             JOIN product p ON op.product_id = p.product_id
             WHERE o.order_type = 'PRODUCTION_ORDER'
             AND o.date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             GROUP BY o.order_id
             ORDER BY o.date DESC`,
            []
        );

        // Format the response
        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items, // items is already a JSON object, no need to parse
            address: order.address ? JSON.parse(order.address) : null
        }));

        res.json({
            success: true,
            orders: formattedOrders
        });
    } catch (error) {
        console.error('Error fetching recent production orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent production orders',
            error: error.message
        });
    }
};

const getAllOrdersForAdmin = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const db = req.db;
        
        // Get all orders
        const [orders] = await db.promise().execute(
            `SELECT o.*, p.payment_status, p.payment_method, 
                    u.first_name, u.last_name, u.email
             FROM orders o 
             LEFT JOIN payments p ON o.order_id = p.order_id
             LEFT JOIN user u ON o.user_id = u.user_id
             ORDER BY o.date DESC`
        );

        // Get items for all orders
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [itemRows] = await db.promise().execute(
                'SELECT op.*, p.product_name, p.image_url, p.selling_price FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
                [order.order_id]
            );

            // If it's a production order, get inventory releases
            let inventoryReleases = [];
            if (order.order_type === 'PRODUCTION_ORDER') {
                const [releaseRows] = await db.promise().execute(
                    `SELECT ir.*, ii.item_name, ii.unit 
                     FROM inventory_release ir 
                     JOIN inventory_item ii ON ir.item_id = ii.item_id 
                     WHERE ir.order_id = ?`,
                    [order.order_id]
                );
                inventoryReleases = releaseRows;
            }

            return {
                ...order,
                items: itemRows,
                inventory_releases: inventoryReleases
            };
        }));

        res.status(200).json({
            success: true,
            data: ordersWithItems
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

const getOrdersByDateRange = async (req, res) => {
    const db = req.db;
    const { startDate, endDate, orderType } = req.query;
    const user_id = req.user.user_id;
    
    try {
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false,
                message: 'Start date and end date are required' 
            });
        }

        // Build the base query
        let query = `
            SELECT o.*, p.payment_status, p.payment_method 
            FROM orders o 
            LEFT JOIN payments p ON o.order_id = p.order_id 
            WHERE o.user_id = ? 
            AND DATE(o.date) BETWEEN ? AND ?
        `;
        const params = [user_id, startDate, endDate];

        // Add order type filter if provided
        if (orderType) {
            query += ' AND o.order_type = ?';
            params.push(orderType);
        }

        query += ' ORDER BY o.date DESC';

        // Get orders
        const [orders] = await db.promise().execute(query, params);

        // Get items for all orders
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [itemRows] = await db.promise().execute(
                'SELECT op.*, p.product_name, p.image_url FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
                [order.order_id]
            );

            // If it's a production order, get inventory releases
            let inventoryReleases = [];
            if (order.order_type === 'PRODUCTION_ORDER') {
                const [releaseRows] = await db.promise().execute(
                    `SELECT ir.*, ii.item_name, ii.unit 
                     FROM inventory_release ir 
                     JOIN inventory_item ii ON ir.item_id = ii.item_id 
                     WHERE ir.order_id = ?`,
                    [order.order_id]
                );
                inventoryReleases = releaseRows;
            }

            return {
                ...order,
                items: itemRows,
                inventory_releases: inventoryReleases,
                shipping_address: order.address ? JSON.parse(order.address) : null
            };
        }));

        // Calculate summary statistics
        const summary = {
            totalOrders: orders.length,
            totalAmount: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
            completedOrders: orders.filter(order => order.order_status === 'COMPLETED').length,
            pendingOrders: orders.filter(order => order.order_status === 'PENDING').length
        };

        res.json({
            success: true,
            data: {
                orders: ordersWithItems,
                summary
            }
        });
    } catch (error) {
        console.error('Error fetching orders by date range:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching orders by date range', 
            error: error.message 
        });
    }
};

/**
 * Update order status and type
 * @route PUT /api/orders/:orderId
 * @access Private (Admin/Manager)
 */
const updateOrderStatus = async (req, res) => {
    const db = req.db;
    const orderId = req.params.orderId;
    const { order_status, order_type } = req.body;
    
    try {
        console.log(`Updating order ${orderId} with status: ${order_status}, type: ${order_type}`);
        
        // Verify the order exists
        const [orderRows] = await db.promise().execute(
            'SELECT * FROM orders WHERE order_id = ?',
            [orderId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Build update query based on provided fields
        let updateFields = [];
        let updateValues = [];
        
        if (order_status) {
            updateFields.push('order_status = ?');
            updateValues.push(order_status);
        }
        
        if (order_type) {
            updateFields.push('order_type = ?');
            updateValues.push(order_type);
        }
        
        // Return early if no fields to update
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No update fields provided'
            });
        }
        
        // Add order_id to values array
        updateValues.push(orderId);
        
        // Execute update query
        const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE order_id = ?`;
        await db.promise().execute(query, updateValues);
        
        // If status is changed to COMPLETED and it's a production order, update product stock
        if (order_status === 'COMPLETED' && orderRows[0].order_type === 'PRODUCTION_ORDER') {
            // Get order items
            const [orderItems] = await db.promise().execute(
                'SELECT op.product_id, op.quantity FROM order_product op WHERE op.order_id = ?',
                [orderId]
            );
            
        }
        
        res.json({
            success: true,
            message: 'Order updated successfully'
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};

const deleteOrder = async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        await db.promise().beginTransaction();

        try {
            // 1. Confirm order exists
            const [orderRows] = await db.promise().execute(
                'SELECT * FROM orders WHERE order_id = ?',
                [id]
            );

            if (orderRows.length === 0) {
                await db.promise().rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // 2. Fetch all releases that have stock_id
            const [releases] = await db.promise().execute(
                `SELECT release_id, item_id, quantity, stock_id 
                 FROM inventory_release 
                 WHERE order_id = ? AND status = 'pending' AND stock_id IS NOT NULL`,
                [id]
            );

            for (const release of releases) {
                await db.promise().execute(
                    `UPDATE inventory_stock 
                     SET quantity_available = quantity_available + ? 
                     WHERE stock_id = ?`,
                    [release.quantity, release.stock_id]
                );

                console.log(`✅ Restored ${release.quantity} to stock_id ${release.stock_id} (item_id: ${release.item_id})`);

                await db.promise().execute(
                    `UPDATE inventory_release 
                     SET status = 'not released' 
                     WHERE release_id = ?`,
                    [release.release_id]
                );
            }

            // 3. Delete the order
            await db.promise().execute(
                'DELETE FROM orders WHERE order_id = ?',
                [id]
            );

            await db.promise().commit();

            res.status(200).json({
                success: true,
                message: 'Order deleted and inventory restored successfully',
                restoredReleases: releases.length,
                deletedOrderId: id
            });

        } catch (error) {
            await db.promise().rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error deleting order:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting order',
            error: error.message
        });
    }
};



const processOrder = async (db, order_id) => {
    const releases = await db.query(`
        SELECT release_id, item_id, quantity 
        FROM inventory_release 
        WHERE order_id = ? AND status = 'pending'
    `, [order_id]);

    for (const release of releases) {
        let remainingQty = release.quantity;

        const stocks = await db.query(`
            SELECT stock_id, quantity_available 
            FROM inventory_stock 
            WHERE item_id = ? AND quantity_available > 0 
            ORDER BY stock_id ASC
        `, [release.item_id]);

        for (const stock of stocks) {
            if (remainingQty <= 0) break;

            const deductQty = Math.min(remainingQty, stock.quantity_available);

            const updateResult = await db.query(`
                UPDATE inventory_stock 
                SET quantity_available = quantity_available - ? 
                WHERE stock_id = ? AND quantity_available >= ?
            `, [deductQty, stock.stock_id, deductQty]);

            if (updateResult.affectedRows > 0) {
                remainingQty -= deductQty;

                await db.query(`
                    UPDATE inventory_release 
                    SET stock_id = ? 
                    WHERE release_id = ?
                `, [stock.stock_id, release.release_id]);

                console.log(`✅ Released ${deductQty} of item_id ${release.item_id} from stock_id ${stock.stock_id}`);
            }
        }

        if (remainingQty > 0) {
            throw new Error(`❌ Insufficient stock for item_id ${release.item_id}. Missing: ${remainingQty}`);
        }
    }

    console.log(`✅ Inventory processed using FIFO for order_id ${order_id}`);
};

const processProductionOrder = async (req, res) => {
    const db = req.db;
    const order_id = req.params.id;

    // ✅ Wrap query to use async/await with plain db connection
    db.query = util.promisify(db.query).bind(db);

    try {
        await processOrder(db, order_id);
        res.status(200).json({ message: 'Production order processed successfully!' });
    } catch (error) {
        console.error('❌ Error processing production order:', error);
        res.status(500).json({ message: 'Failed to process production order', error: error.message });
    }
};


module.exports = {
    // createOrder,
    getAllOrders,
    getOrder,
    getUserOrders,
    // checkInventoryStatus,
    // processInventoryAfterPayment,
    // completeOrder,
    // processInventory,
    handleOrderFlow,
    getRecentProductionOrders,
    getAllOrdersForAdmin,
    getOrdersByDateRange,
    // updateOrder,
    deleteOrder,
    processOrder,
    processProductionOrder,
    updateOrderStatus
};