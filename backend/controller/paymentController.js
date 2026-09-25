const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { processOrder } = require('./OrderController'); // Import processOrder
const util = require('util'); // Make sure this is at the top

// Create a payment intent
exports.createPaymentIntent = async (req, res) => {
    const { amount, order_id } = req.body;
    const user_id = req.user.user_id;
    const db = req.db;

    if (!order_id || !amount) {
        return res.status(400).json({ message: 'Order ID and amount are required' });
    }

    try {
        // Start transaction
        await db.promise().beginTransaction();

        try {
            // 1. Create Stripe PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    order_id,
                    user_id
                }
            });

            // 2. Create payment record
            await db.promise().execute(
                'INSERT INTO payments (order_id, amount, payment_status, stripe_payment_intent_id) VALUES (?, ?, ?, ?)',
                [order_id, amount, 'PENDING', paymentIntent.id]
            );

            // 3. Update order status
            await db.promise().execute(
                'UPDATE orders SET order_status = ? WHERE order_id = ?',
                ['PROCESSING', order_id]
            );

            // 4. 🔥 PROMISIFY db.query so processOrder can use await
            const promisifiedDb = {
                ...db,
                query: util.promisify(db.query).bind(db)
            };


            // 4. ✅ Call processOrder to deduct inventory
            await processOrder(promisifiedDb, order_id);

            // 5. Commit everything
            await db.promise().commit();

            // 6. Send client secret
            res.json({
                clientSecret: paymentIntent.client_secret
            });

        } catch (error) {
            await db.promise().rollback();
            console.error('Error during payment and processing:', error);
            res.status(500).json({ message: 'Payment creation or inventory processing failed', error: error.message });
        }

    } catch (error) {
        console.error('Top-level payment intent creation error:', error);
        res.status(500).json({ message: 'Error creating payment intent', error: error.message });
    }
};

// // Handle webhook events from Stripe
// exports.handleWebhook = async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//         console.error('Webhook signature verification failed:', err.message);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     const db = req.db;

//     // Handle the event
//     switch (event.type) {
//         case 'payment_intent.succeeded':
//             const paymentIntent = event.data.object;
//             try {
//                 await db.promise().beginTransaction();

//                 // Update payment status
//                 await db.promise().execute(
//                     'UPDATE payments SET payment_status = ? WHERE stripe_payment_intent_id = ?',
//                     ['COMPLETED', paymentIntent.id]
//                 );

//                 // Get order details
//                 const [orderRows] = await db.promise().execute(
//                     'SELECT order_type FROM orders WHERE order_id = ?',
//                     [paymentIntent.metadata.order_id]
//                 );

//                 if (orderRows.length > 0) {
//                     const order = orderRows[0];
                    
//                     if (order.order_type === 'DIRECT_SALE') {
//                         // For direct sales, update inventory immediately
//                         const [orderProducts] = await db.promise().execute(
//                             'SELECT product_id, quantity FROM order_product WHERE order_id = ?',
//                             [paymentIntent.metadata.order_id]
//                         );

//                         for (const item of orderProducts) {
//                             await db.promise().execute(
//                                 'UPDATE product SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
//                                 [item.quantity, item.product_id]
//                             );
//                         }

//                         // Update order status to completed for direct sales
//                         await db.promise().execute(
//                             'UPDATE orders SET order_status = ? WHERE order_id = ?',
//                             ['COMPLETED', paymentIntent.metadata.order_id]
//                         );
//                     } else {
//                         // For production orders, create production order entry
//                         const [orderProducts] = await db.promise().execute(
//                             'SELECT product_id FROM order_product WHERE order_id = ? LIMIT 1',
//                             [paymentIntent.metadata.order_id]
//                         );

//                         if (orderProducts.length > 0) {
//                             const [recipeRows] = await db.promise().execute(
//                                 'SELECT recipe_id FROM recipe WHERE product_id = ?',
//                                 [orderProducts[0].product_id]
//                             );

//                             if (recipeRows.length > 0) {
//                                 await db.promise().execute(
//                                     'INSERT INTO production_orders (order_id, recipe_id, production_status, start_time) VALUES (?, ?, ?, NOW())',
//                                     [paymentIntent.metadata.order_id, recipeRows[0].recipe_id, 'PENDING']
//                                 );
//                             }
//                         }

//                         // Update order status to DONE for production orders
//                         await db.promise().execute(
//                             'UPDATE orders SET order_status = ? WHERE order_id = ?',
//                             ['DONE', paymentIntent.metadata.order_id]
//                         );
//                     }
//                 }

//                 await db.promise().commit();
//             } catch (error) {
//                 await db.promise().rollback();
//                 console.error('Error processing payment success:', error);
//             }
//             break;

//         case 'payment_intent.payment_failed':
//             try {
//                 await db.promise().beginTransaction();

//                 // Update payment status
//                 await db.promise().execute(
//                     'UPDATE payments SET payment_status = ? WHERE stripe_payment_intent_id = ?',
//                     ['FAILED', paymentIntent.id]
//                 );

//                 // Update order status
//                 await db.promise().execute(
//                     'UPDATE orders SET order_status = ? WHERE order_id = ?',
//                     ['CANCELLED', paymentIntent.metadata.order_id]
//                 );

//                 await db.promise().commit();
//             } catch (error) {
//                 await db.promise().rollback();
//                 console.error('Error processing payment failure:', error);
//             }
//             break;

//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     res.json({ received: true });
// };

// Get all payments (Admin only)
exports.getAllPayments = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const db = req.db;
        
        const [payments] = await db.promise().execute(`
            SELECT 
                p.*,
                o.order_type,
                o.order_status,
                u.first_name as customer_name
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            LEFT JOIN user u ON o.user_id = u.user_id
            ORDER BY p.transaction_date DESC
        `);

        res.json({
            success: true,
            payments: payments
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching payments',
            error: error.message 
        });
    }
};

// Get payment statistics (Admin only)
exports.getPaymentStatistics = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const db = req.db;
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE p.transaction_date BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        // Get overall statistics
        const [stats] = await db.promise().execute(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN payment_status = 'COMPLETED' THEN amount ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as successful_payments,
                COUNT(CASE WHEN payment_status = 'FAILED' THEN 1 END) as failed_payments,
                COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_payments
            FROM payments p
            ${dateFilter}
        `, params);

        // Get payment method distribution
        const [methodStats] = await db.promise().execute(`
            SELECT 
                payment_method,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM payments p
            ${dateFilter}
            GROUP BY payment_method
        `, params);

        // Get daily transaction summary
        const [dailyStats] = await db.promise().execute(`
            SELECT 
                DATE(transaction_date) as date,
                COUNT(*) as transactions,
                SUM(amount) as total_amount,
                COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as successful,
                COUNT(CASE WHEN payment_status = 'FAILED' THEN 1 END) as failed
            FROM payments p
            ${dateFilter}
            GROUP BY DATE(transaction_date)
            ORDER BY date DESC
            LIMIT 30
        `, params);

        res.json({
            success: true,
            statistics: {
                overall: stats[0],
                paymentMethods: methodStats,
                dailyTransactions: dailyStats
            }
        });
    } catch (error) {
        console.error('Error fetching payment statistics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching payment statistics',
            error: error.message 
        });
    }
};

// Confirm payment manually
exports.confirmPayment = async (req, res) => {
    try {
        const { order_id } = req.body;
        const paymentIntentId = req.params.paymentIntentId;
        const db = req.db;

        await db.promise().beginTransaction();

        try {
            // Verify the payment intent with Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status !== 'succeeded') {
                throw new Error('Payment has not succeeded');
            }

            // Update payment status
            await db.promise().execute(
                'UPDATE payments SET payment_status = ? WHERE stripe_payment_intent_id = ?',
                ['COMPLETED', paymentIntentId]
            );

            // Get order details
            const [orderRows] = await db.promise().execute(
                'SELECT order_type FROM orders WHERE order_id = ?',
                [order_id]
            );

            if (orderRows.length > 0) {
                const order = orderRows[0];
                
                if (order.order_type === 'DIRECT_SALE') {
                    // For direct sales, update inventory immediately
                    const [orderProducts] = await db.promise().execute(
                        'SELECT product_id, quantity FROM order_product WHERE order_id = ?',
                        [order_id]
                    );

                    for (const item of orderProducts) {
                        await db.promise().execute(
                            'UPDATE product SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                            [item.quantity, item.product_id]
                        );
                    }

                    // Update order status to COMPLETED for direct sales
                    await db.promise().execute(
                        'UPDATE orders SET order_status = ? WHERE order_id = ?',
                        ['COMPLETED', order_id]
                    );
                // } else {
                //     // Update order status to COMPLETED for production orders too
                //     await db.promise().execute(
                //         'UPDATE orders SET order_status = ? WHERE order_id = ?',
                //         ['COMPLETED', order_id]
                //     );
                }
            }

            await db.promise().commit();
            res.json({ success: true, message: 'Payment confirmed successfully' });
        } catch (error) {
            await db.promise().rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Error confirming payment', error: error.message });
    }
};

// Get detailed payment information by ID
exports.getPaymentDetails = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' && req.user.role !== 'cashier') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { id } = req.params;
        const db = req.db;
        
        // Get payment details with order and user information
        const [paymentDetails] = await db.promise().execute(`
            SELECT 
                p.*,
                o.order_type,
                o.order_status,
                o.date as order_date,
                o.total_amount as order_total,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                (
                    SELECT GROUP_CONCAT(
                        JSON_OBJECT(
                            'product_name', pr.product_name,
                            'quantity', op.quantity,
                            'unit_price', pr.selling_price,
                            'subtotal', (pr.selling_price * op.quantity)
                        )
                    )
                    FROM order_product op
                    JOIN product pr ON op.product_id = pr.product_id
                    WHERE op.order_id = p.order_id
                ) as order_items
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            LEFT JOIN user u ON o.user_id = u.user_id
            WHERE p.payment_id = ?
        `, [id]);

        if (!paymentDetails[0]) {
            return res.status(404).json({ 
                success: false,
                message: 'Payment not found' 
            });
        }

        // Parse the order items JSON string
        if (paymentDetails[0].order_items) {
            try {
                // Split by comma but handle escaped commas within JSON
                const itemStrings = paymentDetails[0].order_items.match(/({[^}]+})/g) || [];
                const itemsArray = itemStrings.map(item => JSON.parse(item.trim()));
                paymentDetails[0].order_items = itemsArray;
            } catch (error) {
                console.error('Error parsing order items:', error);
                paymentDetails[0].order_items = [];
            }
        } else {
            paymentDetails[0].order_items = [];
        }

        res.json({
            success: true,
            payment: paymentDetails[0]
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching payment details',
            error: error.message 
        });
    }
};

exports.getPaymentsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Start date and end date are required' 
            });
        }

        const query = `
            SELECT 
                p.*,
                o.order_id,
                o.total_amount as order_amount
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.order_id
            WHERE p.transaction_date BETWEEN ? AND ?
            ORDER BY p.transaction_date DESC
        `;

        const [payments] = await req.db.promise().query(query, [startDate, endDate]);

        // Calculate total amount
        const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

        res.status(200).json({
            success: true,
            data: {
                payments,
                totalAmount,
                paymentCount: payments.length
            }
        });
    } catch (error) {
        console.error('Error fetching payments by date range:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching payments by date range',
            error: error.message 
        });
    }
}; 