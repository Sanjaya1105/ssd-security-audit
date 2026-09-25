// Requires nodemailer package: npm install nodemailer
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER, // Add this to your .env file
    pass: process.env.EMAIL_PASSWORD, // Add this to your .env file
  },
});

/**
 * Send an order confirmation email
 * @param {Object} options - Email options
 * @param {string} options.email - Customer email address
 * @param {string} options.name - Customer name
 * @param {Array} options.items - Order items
 * @param {number} options.total - Order total
 * @param {string} options.orderId - Order ID
 * @param {string} options.orderType - Order type (DIRECT_SALE or PRODUCTION_ORDER)
 * @returns {Promise} - Promise resolving to email send info
 */
const sendOrderConfirmation = async ({ email, name, items, total, orderId, orderType }) => {
  try {
    // Create HTML table for items
    const itemsTable = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Quantity</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.product_name}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Rs. ${item.unit_price.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Rs. ${(item.unit_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Total:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Rs. ${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    // Set email options
    const mailOptions = {
      from: `"Hot & Fast Restaurant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation #${orderId} - Hot & Fast Restaurant`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #374151; margin-bottom: 10px;">Order Confirmation</h1>
            <p style="color: #6b7280; font-size: 16px;">Thank you for your order!</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #374151; font-size: 18px; margin-bottom: 10px;">Order Details</h2>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 5px 0;"><strong>Order Type:</strong> ${orderType === 'DIRECT_SALE' ? 'Direct Sale' : 'Production Order'}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #374151; font-size: 18px; margin-bottom: 10px;">Order Summary</h2>
            ${itemsTable}
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; text-align: center; color: #4b5563;">If you have any questions about your order, please contact our customer service at <a href="mailto:support@hotfast.com" style="color: #2563eb; text-decoration: none;">support@hotfast.com</a> or call us at (123) 456-7890.</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Hot & Fast Restaurant</p>
            <p>123 Food Street, Cuisine City</p>
            <p>&copy; ${new Date().getFullYear()} Hot & Fast. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

/**
 * Send a password reset verification code
 * @param {string} email - User's email address
 * @param {string} code - Verification code
 * @returns {Promise} - Promise resolving to email send info
 */
const sendVerificationCode = async (email, code) => {
  try {
    const mailOptions = {
      from: `"Hot & Fast Restaurant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Verification Code - Hot & Fast Restaurant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #374151; margin-bottom: 10px;">Password Reset</h1>
            <p style="color: #6b7280; font-size: 16px;">You have requested to reset your password.</p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <h2 style="color: #374151; font-size: 18px; margin-bottom: 10px;">Your Verification Code</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #22c55e; letter-spacing: 5px; margin: 0;">${code}</p>
            </div>
            <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; text-align: center; color: #4b5563;">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Hot & Fast Restaurant</p>
            <p>&copy; ${new Date().getFullYear()} Hot & Fast. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification code email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification code email:', error);
    throw error;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendVerificationCode
}; 