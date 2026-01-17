const mongoose = require('mongoose');

// 1. Admin/Staff Users
const adminUserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID to match existing
    name: { type: String, required: true },
    role: { type: String, enum: ['owner', 'seller', 'courier'], required: true },
    password: { type: String, required: true },
    phone: String,
    isOnline: { type: Boolean, default: false }
});

// 2. Products
const productSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: String,
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    discountPercentage: { type: Number, default: 0 },
    image: String,
    description: String,
    colors: [String], // Array of strings
    stock: { type: Number, default: 50 },
    purchased: { type: Number, default: 0 } // Tracks total sales of this product
});

// 3. Customers (Registered Users)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    password: { type: String, required: true },
    address: String,
    city: String,
    zip: String,
    birthday: Date,
    profile_picture: String,
    joinedDate: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    verificationCode: String,
    resetCode: String
});

// 4. Wishlist (Embedded in User or Separate? SQL was strict relation. Let's keep separate for scalability or embed IDs)
// Mongoose commonly uses Arrays of ObjectIds. Let's create a separate simple schema if needed, or just an array in User.
// SQL table was 'wishlist' (user_id, product_id). Let's stick to a collection for M2M to avoid massive arrays in User.
const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    createdAt: { type: Date, default: Date.now }
});
// Composite unique index
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

// 5. Orders
const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to product
    name: String,
    image: String,
    price: Number,
    quantity: Number,
    size: String,
    color: String,
    code: String,
    category: String // Added per recent fix
});

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Custom ID 'F00001'
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for guests
    customer: {
        name: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        zip: String
    },
    items: [orderItemSchema],
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Hand on Courier', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    total: { type: Number, required: true },
    isLabelPrinted: { type: Boolean, default: false },
    timeline: {
        processingAt: Date,
        handOnCourierAt: Date,
        shippedAt: Date,
        deliveredAt: Date,
        cancelledAt: Date
    },
    courier: {
        forwardedBy: String,
        deliveredBy: String
    }
});

// 6. Newsletter
const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

// 7. Cart Items (Persistent)
const cartItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    size: String,
    color: String,
    code: String
});

// 8. Admin Notifications
const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    type: String,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    target_role: String // 'owner', 'seller', or null (though now we use specific roles)
});

// 9. Guest Customers
const guestCustomerSchema = new mongoose.Schema({
    // Core Identity (we rely on email as unique identifier for guests)
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: String,

    // Shipping Details (Updated on last order)
    address: String,
    city: String,
    zip: String,

    // Analytics / Logic
    firstOrderDate: { type: Date, default: Date.now },
    lastOrderDate: { type: Date, default: Date.now },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
});

module.exports = {
    AdminUser: mongoose.model('AdminUser', adminUserSchema),
    Product: mongoose.model('Product', productSchema),
    User: mongoose.model('User', userSchema),
    Wishlist: mongoose.model('Wishlist', wishlistSchema),
    Order: mongoose.model('Order', orderSchema),
    Newsletter: mongoose.model('Newsletter', subscriberSchema),
    CartItem: mongoose.model('CartItem', cartItemSchema),
    Notification: mongoose.model('Notification', notificationSchema),
    GuestCustomer: mongoose.model('GuestCustomer', guestCustomerSchema)
};
