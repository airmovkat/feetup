CREATE DATABASE IF NOT EXISTS feetup_db;
USE feetup_db;

-- 1. Admin/Staff Users (Owner, Seller, Courier)
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(50) PRIMARY KEY, 
    name VARCHAR(100) NOT NULL,
    role ENUM('owner', 'seller', 'courier') NOT NULL,
    password VARCHAR(255) NOT NULL, 
    phone VARCHAR(20),
    isOnline BOOLEAN DEFAULT FALSE
);

INSERT IGNORE INTO admin_users (id, name, role, password, phone) VALUES 
('owner-1', 'Admin', 'owner', 'admin123', '0000000000');

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    gender ENUM('men', 'women', 'unisex', 'kids'),
    isFeatured BOOLEAN DEFAULT FALSE,
    isOnSale BOOLEAN DEFAULT FALSE,
    discountPercentage INT DEFAULT 0,
    image TEXT,

    description TEXT,
    colors TEXT, -- JSON array of colors
    stock INT DEFAULT 50
);

-- Seed Products
INSERT IGNORE INTO products (id, code, name, price, category, gender, isFeatured, isOnSale, image, description) VALUES
(1, 'RUN-M-001', 'Air Walker Pro', 129.99, 'Running', 'men', TRUE, FALSE, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Built for speed and comfort, the Air Walker Pro features responsive cushioning.'),
(2, 'CAS-W-002', 'Urban Glide', 89.99, 'Casual', 'women', TRUE, FALSE, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Chic design meets everyday comfort. Perfect for city living.'),
(3, 'HIK-M-003', 'Trail Master X', 159.99, 'Hiking', 'men', TRUE, FALSE, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Rugged durability for the toughest trails. Waterproof and breathable.'),
(4, 'BAS-U-004', 'Court Legend', 109.99, 'Basketball', 'unisex', TRUE, FALSE, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Dominate the court with superior grip and ankle support.'),
(5, 'LIF-M-005', 'Street Style High', 79.99, 'Lifestyle', 'men', TRUE, FALSE, 'https://images.unsplash.com/photo-1520256862855-3982eb6c8ca5?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Retro-inspired high tops that make a statement.'),
(6, 'RUN-W-006', 'Zen Runner', 119.99, 'Running', 'women', TRUE, FALSE, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Minimalist design for maximum performance.'),
(7, 'LIF-U-007', 'Eco Flex', 99.99, 'Lifestyle', 'unisex', TRUE, FALSE, 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Made from recycled materials without compromising on style or comfort.'),
(8, 'PER-M-008', 'Midnight Pulse', 145.00, 'Performance', 'men', TRUE, FALSE, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800&ixlib=rb-4.0.3', 'Engineered for night runners with reflective details and high responsiveness.');

-- 3. Customers (Registered Users)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    zip VARCHAR(20),
    birthday DATE,
    profile_picture LONGTEXT,
    joinedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    isVerified BOOLEAN DEFAULT FALSE,
    isOnline BOOLEAN DEFAULT FALSE,
    verificationCode VARCHAR(10),
    resetCode VARCHAR(10)
);

-- 4. Wishlist (Many-to-Many User <-> Product)
CREATE TABLE IF NOT EXISTS wishlist (
    user_id BIGINT,
    product_id BIGINT,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY, -- 'F000001'
    user_id BIGINT NULL, 
    customer_name VARCHAR(100), 
    customer_email VARCHAR(150), 
    customer_phone VARCHAR(50), 
    customer_address TEXT, 
    customer_city VARCHAR(100),
    customer_zip VARCHAR(20),
    
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Processing', 'Hand on Courier', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    total DECIMAL(10, 2) NOT NULL,
    isLabelPrinted BOOLEAN DEFAULT FALSE,
    
    processingAt DATETIME,
    handOnCourierAt DATETIME,
    shippedAt DATETIME,
    deliveredAt DATETIME,
    cancelledAt DATETIME,
    
    forwardedBy VARCHAR(100), 
    deliveredBy VARCHAR(100)  
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50),
    product_id BIGINT,
    name VARCHAR(255), 
    image VARCHAR(255),
    price DECIMAL(10, 2), 
    quantity INT,
    size VARCHAR(10),
    color VARCHAR(50),
    code VARCHAR(50),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 7. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cart Items (Persistent Cart)
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    name VARCHAR(255),
    image VARCHAR(255),
    price DECIMAL(10, 2),
    quantity INT DEFAULT 1,
    size VARCHAR(10),
    color VARCHAR(50),
    code VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 9. Admin Notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    isRead BOOLEAN DEFAULT FALSE,
    target_role VARCHAR(50) NULL -- NULL means all admins
);
