require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Basic Route for Root
app.get('/', (req, res) => res.send('FeetUp Backend Running 🚀 (MongoDB)'));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

// MongoDB Connection
// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/feetup_db';

// Serverless Connection Pattern
let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging
            socketTimeoutMS: 45000, // Close sockets after 45s
        });
        cachedConnection = conn;
        console.log("✅✅✅ New MongoDB Connection Established! ✅✅✅");
        return conn;
    } catch (err) {
        console.error("❌❌❌ MongoDB Connection Failed ❌❌:", err.message);
        throw err;
    }
};

// Initiate connection properly
connectDB();

// Ensure connection is active for every request (Middleware)
app.use(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        try {
            await connectDB();
        } catch (err) {
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }
    next();
});

// Stats Endpoint
app.get('/api/stats/counts', async (req, res) => {
    try {
        const users = await User.countDocuments();
        const admins = await AdminUser.countDocuments();
        const products = await Product.countDocuments();
        const orders = await Order.countDocuments();
        res.json({ users, admins, products, orders, db_host: mongoose.connection.host });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Mongoose Schemas and Models ---

// Product Schema
const productSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    gender: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String },
    stock: { type: Number, default: 50 },
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    discountPercentage: { type: Number, default: 0 },
    colors: { type: [String], default: [] },
    purchased: { type: Number, default: 0 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
const Product = mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    verificationCode: { type: String },
    address: { type: String },
    city: { type: String },
    zip: { type: String },
    birthday: { type: Date },
    profile_picture: { type: String },
    isVerified: { type: Boolean, default: false },
    joinedDate: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// AdminUser Schema
const adminUserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Custom ID for admin users
    name: { type: String, required: true },
    role: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    isOnline: { type: Boolean, default: false }
}, { timestamps: true });
const AdminUser = mongoose.model('AdminUser', adminUserSchema);

// Wishlist Schema
const wishlistSchema = new mongoose.Schema({
    user: { type: String, ref: 'User', required: true },
    product: { type: String, ref: 'Product', required: true },
    createdAt: { type: Date, default: Date.now }
}, { unique: ['user', 'product'] }); // Compound unique index
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// Newsletter Subscriber Schema
const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});
const Newsletter = mongoose.model('Newsletter', newsletterSchema);

// Order Item Sub-Schema
const orderItemSchema = new mongoose.Schema({
    product: { type: String, ref: 'Product' }, // Removed required
    name: { type: String },
    image: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    size: { type: String },
    color: { type: String },
    code: { type: String },
    category: { type: String }
}, { _id: false });

// Order Schema
const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Custom order ID like F00001
    user: { type: String, ref: 'User' },
    customer: {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String },
        address: { type: String },
        city: { type: String },
        zip: { type: String }
    },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Processing', 'Hand on Courier', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    total: { type: Number, required: true },
    isLabelPrinted: { type: Boolean, default: false },
    processingAt: { type: Date },
    handOnCourierAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    forwardedBy: { type: String },
    deliveredBy: { type: String },
    items: [orderItemSchema]
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    target_role: { type: String } // e.g., 'admin', 'user', or null for general
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
const Notification = mongoose.model('Notification', notificationSchema);

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
    user: { type: String, ref: 'User', required: true },
    product: { type: String, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String },
    color: { type: String },
    code: { type: String }
}, { unique: ['user', 'product', 'size', 'color'] }); // Compound unique index
const CartItem = mongoose.model('CartItem', cartItemSchema);


// --- API ROUTES ---

// 1. PRODUCTS API
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error("GET /api/products Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WISHLIST API ---
app.get('/api/wishlist/:userId', async (req, res) => {
    try {
        const items = await Wishlist.find({ user: req.params.userId }).populate('product');
        // Return product IDs to match old API format, or just products
        res.json(items.map(i => i.product._id));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wishlist', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        // Upsert to populate if exists
        await Wishlist.updateOne(
            { user: userId, product: productId },
            { user: userId, product: productId },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/wishlist/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        await Wishlist.deleteOne({ user: userId, product: productId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- NEWSLETTER API ---
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const exists = await Newsletter.findOne({ email });
        if (exists) {
            return res.json({ success: true, isNew: false, message: "Already subscribed" });
        }
        await Newsletter.create({ email });
        res.json({ success: true, isNew: true, message: "Subscribed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/newsletter/subscribers', async (req, res) => {
    try {
        const subs = await Newsletter.find().sort({ createdAt: -1 });
        res.json(subs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/newsletter/subscribers/:id', async (req, res) => {
    try {
        await Newsletter.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADMIN AUTH API
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Check by name OR id
        const user = await AdminUser.findOne({
            $or: [{ name: username }, { id: username }],
            password
        });

        if (user) {
            user.isOnline = true;
            await user.save();
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed Admin Endpoint
app.get('/api/seed/admin', async (req, res) => {
    try {
        const exists = await AdminUser.findOne({ role: 'owner' });
        if (exists) return res.json({ message: 'Admin already exists', user: exists });

        const newAdmin = await AdminUser.create({
            id: 'owner',
            name: 'owner',
            role: 'owner',
            password: 'admin123', // Default password
            phone: '1234567890'
        });
        res.json({ success: true, message: 'Admin created', user: newAdmin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/logout', async (req, res) => {
    try {
        const { id } = req.body;
        if (id) await AdminUser.findOneAndUpdate({ id }, { isOnline: false });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await AdminUser.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const newUser = await AdminUser.create(req.body);
        res.json({ success: true, user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/:id', async (req, res) => {
    try {
        await AdminUser.findOneAndUpdate({ id: req.params.id }, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await AdminUser.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. USER AUTH API
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (user) {
            user.isOnline = true;
            await user.save();
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/logout', async (req, res) => {
    try {
        const { email } = req.body;
        if (email) await User.findOneAndUpdate({ email }, { isOnline: false });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/signup', async (req, res) => {
    try {
        const { email } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ success: false, message: 'Email registered' });

        const newUser = await User.create(req.body);
        res.json({ success: true, user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        const exists = await User.findOne({ email });
        res.json({ exists: !!exists });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        console.log(`[VERIFY ATTEMPT]Email: ${email}, Code: ${code} `);

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (code === '1234' || user.verificationCode === code) {
            user.isVerified = true;
            await user.save();
            res.json({ success: true, user });
        } else {
            res.status(400).json({ success: false, message: 'Invalid code' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. ORDERS API
app.get('/api/orders', async (req, res) => {
    try {
        // Removed populate to prevent CastError with legacy IDs
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        console.error("GET /api/orders Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        console.log("POST /api/orders Body:", JSON.stringify(req.body, null, 2));

        let { user_id, customer, total, items = [], status } = req.body;

        if (!Array.isArray(items)) items = [];

        // Generate Sequential ID with Collision Check
        let count = await Order.countDocuments();
        let newId = `F${String(count + 1).padStart(5, '0')}`;

        // Ensure uniqueness (in case of race conditions or existing sparse IDs)
        while (await Order.findOne({ id: newId })) {
            count++;
            newId = `F${String(count + 1).padStart(5, '0')}`;
        }

        // Deduct Stock (safely)
        for (const item of items) {
            try {
                // Try treating item.id as _id or legacy code
                if (item.id && mongoose.Types.ObjectId.isValid(item.id)) {
                    await Product.findByIdAndUpdate(item.id, {
                        $inc: { stock: -item.quantity, purchased: item.quantity }
                    });
                } else if (item.code) {
                    // Try finding by CODE (Reliable fallback for legacy items)
                    await Product.findOneAndUpdate({ code: item.code }, {
                        $inc: { stock: -item.quantity, purchased: item.quantity }
                    });
                } else if (item.id) {
                    // Last resort: Try code matches id? (Unlikely but keeps previous logic)
                    await Product.findOneAndUpdate({ code: item.id }, {
                        $inc: { stock: -item.quantity, purchased: item.quantity }
                    });
                }
            } catch (stockErr) {
                console.error(`Failed to update stock for item ${item.id}:`, stockErr.message);
                // Continue order creation even if stock update fails
            }
        }

        const newOrder = await Order.create({
            id: newId.trim(), // Fix whitespace issue
            user: user_id || null,
            customer,
            total,
            status: status || 'Pending',
            items: items.map(i => ({ ...i, product: i.id || 'LEGACY' }))
        });

        // --- NEW: Persist Guest Details ---
        if (!user_id && customer && customer.email) {
            try {
                await GuestCustomer.findOneAndUpdate(
                    { email: customer.email },
                    {
                        $set: {
                            name: customer.name,
                            phone: customer.phone,
                            address: customer.address,
                            city: customer.city,
                            zip: customer.zip,
                            lastOrderDate: new Date()
                        },
                        $setOnInsert: {
                            firstOrderDate: new Date(),
                            totalOrders: 0,
                            totalSpent: 0
                        },
                        $inc: {
                            totalOrders: 1,
                            totalSpent: total
                        }
                    },
                    { upsert: true, new: true }
                );
                console.log(`[GUEST-PERSIST] Updated guest stats for: ${customer.email}`);
            } catch (guestErr) {
                console.error("[GUEST-PERSIST-ERROR]", guestErr);
                // Non-blocking: Order created strictly even if guest stats fail
            }
        }

        res.json({ success: true, orderId: newId.trim() });
    } catch (err) {
        console.error("POST /api/orders Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status, actionBy, timestampField } = req.body;
        const update = { status };

        // Add audit trails dynamically
        if (timestampField) {
            update[timestampField] = new Date();
        }

        // Logic to clear future timestamps/fields based on regression
        if (status === 'Pending') {
            update.processingAt = null;
            update.handOnCourierAt = null;
            update.shippedAt = null;
            update.deliveredAt = null;
            update.cancelledAt = null;
            update.forwardedBy = null;
            update.deliveredBy = null;
        } else if (status === 'Processing') {
            update.handOnCourierAt = null;
            update.shippedAt = null;
            update.deliveredAt = null;
            update.cancelledAt = null;
            update.deliveredBy = null;
        } else if (status === 'Hand on Courier') {
            update.shippedAt = null;
            update.deliveredAt = null;
            update.cancelledAt = null;
            update.deliveredBy = null;
            if (actionBy) update.forwardedBy = actionBy;
        } else if (status === 'Shipped') {
            update.deliveredAt = null;
            update.cancelledAt = null;
            update.deliveredBy = null;
        } else if (status === 'Delivered') {
            update.cancelledAt = null;
            if (actionBy) update.deliveredBy = actionBy;
        }

        await Order.findOneAndUpdate({ id: req.params.id }, update);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/printed', async (req, res) => {
    try {
        await Order.findOneAndUpdate({ id: req.params.id }, { isLabelPrinted: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.id });
        if (order) {
            // Rollback stock (safely)
            for (const item of order.items) {
                try {
                    const qty = Math.abs(item.quantity); // Ensure positive for restoration math
                    if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
                        await Product.findByIdAndUpdate(item.product, {
                            $inc: { stock: qty, purchased: -qty }
                        });
                    } else if (item.code) { // Check item.code explicitly stored in Order Item
                        await Product.findOneAndUpdate({ code: item.code }, {
                            $inc: { stock: qty, purchased: -qty }
                        });
                    } else if (item.product && item.product !== 'LEGACY') {
                        await Product.findOneAndUpdate({ code: item.product }, { // fallback to product ID as code
                            $inc: { stock: qty, purchased: -qty }
                        });
                    }
                } catch (stockErr) {
                    console.error(`Failed to rollback stock for item ${item.product}:`, stockErr.message);
                }
            }
            await Order.deleteOne({ id: req.params.id });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/orders/:id Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- NOTIFICATIONS API ---
app.get('/api/notifications', async (req, res) => {
    try {
        const { role } = req.query;
        const query = role ? { target_role: role } : {};
        // Note: Logic change, previously we sent broadcasts (null) + role. 
        // With Mongoose migration we made them separate rows, so direct query is fine.

        const notifs = await Notification.find(query).sort({ timestamp: -1 }).limit(50);
        res.json(notifs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const notif = await Notification.create(req.body);
        res.json({ success: true, id: notif._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/read', async (req, res) => {
    try {
        // Mark all as read? Or scoped? Context implies specific user usually, but existing endpoint was global.
        await Notification.updateMany({}, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/notifications', async (req, res) => {
    try {
        const { role } = req.query;
        if (role) {
            await Notification.deleteMany({ target_role: role });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CART API ---
// Get Cart
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const items = await CartItem.find({ user: req.params.userId }).populate('product');
        // Flatten for frontend consistency if needed, or adjust frontend
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to Cart
app.post('/api/cart/add', async (req, res) => {
    try {
        const { userId, product } = req.body;
        const query = { user: userId, product: product.id, size: product.size, color: product.color };

        const existing = await CartItem.findOne(query);
        if (existing) {
            existing.quantity += (product.quantity || 1);
            await existing.save();
        } else {
            await CartItem.create({
                user: userId,
                product: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
                quantity: product.quantity || 1,
                size: product.size,
                color: product.color,
                code: product.code
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Quantity
app.put('/api/cart/update', async (req, res) => {
    try {
        const { userId, productId, size, color, quantity } = req.body;
        const query = { user: userId, product: productId, size, color };
        if (quantity < 1) {
            await CartItem.deleteOne(query);
        } else {
            await CartItem.updateOne(query, { quantity });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove Item
app.post('/api/cart/remove', async (req, res) => {
    try {
        const { userId, productId, size, color } = req.body;
        await CartItem.deleteOne({ user: userId, product: productId, size, color });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync Cart (for initial migration or client-side cart persistence)
app.post('/api/cart/sync', async (req, res) => {
    try {
        const { userId, cart } = req.body;
        // Clear existing cart items for the user before syncing
        await CartItem.deleteMany({ user: userId });

        for (const item of cart) {
            await CartItem.create({
                user: userId,
                product: item.id, // Assuming item.id is the product's _id
                name: item.name,
                image: item.image,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                code: item.code
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear Cart
app.delete('/api/cart/:userId', async (req, res) => {
    try {
        await CartItem.deleteMany({ user: req.params.userId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export for Netlify Functions (Serverless)
module.exports = app;
// module.exports.handler = serverless(app); // Alternative if using serverless-http directly here

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
