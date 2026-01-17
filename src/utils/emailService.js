import emailjs from '@emailjs/browser';

// REPLACE THESE WITH YOUR ACTUAL EMAILJS CREDENTIALS
// You can get these from https://dashboard.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_pgt8jwy';
const EMAILJS_AUTH_TEMPLATE_ID = 'template_nb7muja'; // Existing OTP Template
const EMAILJS_ORDER_TEMPLATE_ID = 'template_oylcmt7'; // <--- CREATE THIS NEW TEMPLATE IN EMAILJS AND PASTE ID HERE
const EMAILJS_PUBLIC_KEY = 'mr1LpS8WVTm8dnadv';

export const initEmailService = () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
};

// Generic send function updated to support different template IDs and extra parameters
export const sendEmail = async (to_email, to_name, subject, message, code = '', templateId = EMAILJS_AUTH_TEMPLATE_ID, extraParams = {}) => {
    try {
        // Calculate expiration time (5 minutes from now)
        const expiryTime = new Date(Date.now() + 5 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const baseParams = {
            to_email: to_email,
            email: to_email,
            recipient: to_email,
            to_name: to_name,
            subject: subject,
            message: message,
            title: subject,
            code: code,
            passcode: code,
            time: expiryTime,
        };

        // Merge base params with any extra rich data passed
        const templateParams = { ...baseParams, ...extraParams };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            templateId,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('Email sent successfully!', response.status, response.text);
        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error };
    }
};

export const sendVerificationCode = async (email, name, code) => {
    return sendEmail(
        email,
        name,
        'Verify Your Email - FeetUp',
        `Your verification code is: ${code}`,
        code,
        EMAILJS_AUTH_TEMPLATE_ID
    );
};

export const sendPasswordResetCode = async (email, code) => {
    return sendEmail(
        email,
        'Valued Customer',
        'Password Reset Request - FeetUp',
        `Your password reset code is: ${code}`,
        code,
        EMAILJS_AUTH_TEMPLATE_ID
    );
};

export const sendOrderConfirmation = async (orderData) => {
    const { orderId, customer, items, total, currency, exchangeRate: appExchangeRate } = orderData;
    const orderDate = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

    // Determine Currency and Exchange Rate
    // Assumption: Base prices in DB are in USD.
    const isLKR = currency === 'LKR' || currency === 'Rs' || currency === 'Rs.' || (typeof currency === 'string' && currency.includes('Rs'));

    // Use the dynamic rate passed from the app if available, otherwise fallback to 300
    const exchangeRate = isLKR ? (appExchangeRate || 300) : 1;
    const currencySymbol = isLKR ? 'Rs.' : '$';

    // Helper to fix decimal places
    const formatVal = (val) => Number(val).toFixed(2);

    // Calculate Subtotal (Sum of items)
    // We recalculate from items to be sure, converting to the target currency
    let calculatedSubtotal = 0;

    // Generate HTML Table Rows for Items
    const itemsHtmlRows = items.map(item => {
        // Convert price to target currency
        const unitPrice = item.price * exchangeRate;
        const itemTotal = unitPrice * item.quantity;

        calculatedSubtotal += itemTotal;

        return `
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 10px; text-align: center;">
                <img src="${item.image}" alt="${item.name}" width="60" height="60" style="object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
            </td>
            <td style="padding: 10px;">
                <div style="font-weight: bold; color: #333; font-size: 14px;">${item.name}</div>
                <div style="color: #888; font-size: 12px;">Size: ${item.size} ${item.color ? `| Color: ${item.color}` : ''}</div>
                <div style="color: #888; font-size: 12px;">Ref: ${item.code || 'N/A'}</div>
            </td>
            <td style="padding: 10px; text-align: center; color: #555;">
                x${item.quantity}
            </td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #333;">
                ${currencySymbol} ${formatVal(unitPrice)}
            </td>
             <td style="padding: 10px; text-align: right; font-weight: bold; color: #e67e23;">
                ${currencySymbol} ${formatVal(itemTotal)}
            </td>
        </tr>
        `;
    }).join('');

    // Shipping Logic
    // If LKR: Shipping is Rs. 500.
    // If USD: Shipping should be equivalent to Rs. 500 converted to USD.
    // We use the same exchange rate to convert back: 500 LKR / Rate = USD value.
    const effectiveRate = appExchangeRate || 300;
    const shippingFee = isLKR ? 500 : (500 / effectiveRate);
    const shippingDisplay = `${currencySymbol} ${formatVal(shippingFee)}`;

    // Grand Total
    const grandTotal = calculatedSubtotal + shippingFee;

    // Prepare Extra Parameters for the template
    const extraParams = {
        order_date: orderDate,
        customer_address: customer.address,
        customer_city: customer.city,
        customer_zip: customer.zip,
        customer_phone: customer.phone,
        items_html: itemsHtmlRows,
        // We pass the calculated subtotal and grand total
        raw_total: formatVal(calculatedSubtotal), // Used for Subtotal row
        grand_total: formatVal(grandTotal),       // Used for Grand Total row
        currency_symbol: currencySymbol,
        shipping_cost: shippingDisplay,
        order_id: orderId
    };

    const message = `Order #${orderId} confirmed for ${customer.name}. Total: ${currencySymbol} ${formatVal(grandTotal)}`;

    return sendEmail(
        customer.email,
        customer.name,
        `Order Confirmation - #${orderId}`,
        message,
        '',
        EMAILJS_ORDER_TEMPLATE_ID,
        extraParams
    );
};
