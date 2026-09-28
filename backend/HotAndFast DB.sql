CREATE DATABASE hotandfast2;

USE hotandfast2;
-- ==========================================
-- LEVEL 1: Independent Tables
-- ==========================================

CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(300) NOT NULL,
  `role` enum('customer','manager','admin','cashier') DEFAULT 'customer',
  `reset_code` varchar(6) DEFAULT NULL,
  `reset_code_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_item` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(200) DEFAULT NULL,
  `item_description` varchar(200) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `restock_level` int DEFAULT '5',
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(200) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `selling_price` float DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `image_url` varchar(300) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `min_production_amount` int DEFAULT NULL,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sales` (
  `sale_id` int NOT NULL AUTO_INCREMENT,
  `sale_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`sale_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- LEVEL 2: First-Degree Dependencies
-- ==========================================

CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `comment_` varchar(500) DEFAULT NULL,
  `star_rating` int DEFAULT NULL,
  PRIMARY KEY (`feedback_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `order_type` enum('DIRECT_SALE','PRODUCTION_ORDER') DEFAULT NULL,
  `order_status` enum('PENDING','PROCESSING','COMPLETED','CANCELLED') DEFAULT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  `address` text,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('CARD','CASH') DEFAULT 'CARD',
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `purchase` (
  `purchase_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int DEFAULT NULL,
  `purchase_date` datetime DEFAULT NULL,
  `purchased_quantity` float DEFAULT NULL,
  `wasted_quantity` float DEFAULT NULL,
  `useful_quantity` float DEFAULT NULL,
  `buying_price` float DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`purchase_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product_inventory_release` (
  `product_inventory_release_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `quantity` float NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  PRIMARY KEY (`product_inventory_release_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_inventory_release_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `recipe` (
  `product_item_id` int NOT NULL,
  `ingredient_item_id` int NOT NULL,
  `quantity_required_per_unit` float DEFAULT NULL,
  PRIMARY KEY (`product_item_id`,`ingredient_item_id`),
  KEY `ingredient_item_id` (`ingredient_item_id`),
  CONSTRAINT `recipe_ibfk_1` FOREIGN KEY (`product_item_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `recipe_ibfk_2` FOREIGN KEY (`ingredient_item_id`) REFERENCES `inventory_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- LEVEL 3: Second-Degree Dependencies
-- ==========================================

CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('PENDING','COMPLETED','FAILED') DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `transaction_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_product` (
  `order_product_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`order_product_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_product_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_product_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sale_items` (
  `sale_item_id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`sale_item_id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`),
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_stock` (
  `stock_id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `quantity_available` float DEFAULT NULL,
  PRIMARY KEY (`stock_id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `inventory_stock_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`purchase_id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_stock_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `production_log` (
  `production_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `product_inventory_release_id` int DEFAULT NULL,
  `planned_quantity` int DEFAULT NULL,
  `actual_quantity` int DEFAULT NULL,
  `date_time` datetime DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`production_id`),
  KEY `product_id` (`product_id`),
  KEY `product_inventory_release_id` (`product_inventory_release_id`),
  CONSTRAINT `production_log_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `production_log_ibfk_2` FOREIGN KEY (`product_inventory_release_id`) REFERENCES `product_inventory_release` (`product_inventory_release_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- LEVEL 4: Third-Degree Dependencies
-- ==========================================

CREATE TABLE `inventory_release` (
  `release_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `stock_id` int DEFAULT NULL,
  `quantity` float DEFAULT NULL,
  `date_time` datetime DEFAULT NULL,
  `status` enum('pending','released','not released') DEFAULT 'pending',
  PRIMARY KEY (`release_id`),
  KEY `order_id` (`order_id`),
  KEY `item_id` (`item_id`),
  KEY `stock_id` (`stock_id`),
  CONSTRAINT `inventory_release_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_release_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_item` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_release_ibfk_3` FOREIGN KEY (`stock_id`) REFERENCES `inventory_stock` (`stock_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product_inventory_release_items` (
  `product_inventory_release_item_id` int NOT NULL AUTO_INCREMENT,
  `product_inventory_release_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` float NOT NULL,
  `stock_id` int NOT NULL,
  PRIMARY KEY (`product_inventory_release_item_id`),
  KEY `product_inventory_release_id` (`product_inventory_release_id`),
  KEY `stock_id` (`stock_id`),
  CONSTRAINT `product_inventory_release_items_ibfk_1` FOREIGN KEY (`product_inventory_release_id`) REFERENCES `product_inventory_release` (`product_inventory_release_id`) ON DELETE CASCADE,
  CONSTRAINT `product_inventory_release_items_ibfk_2` FOREIGN KEY (`stock_id`) REFERENCES `inventory_stock` (`stock_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product_stock` (
  `stock_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `production_id` int NOT NULL,
  `quantity_available` int NOT NULL,
  `last_updated` datetime NOT NULL,
  PRIMARY KEY (`stock_id`),
  KEY `product_id` (`product_id`),
  KEY `production_id` (`production_id`),
  CONSTRAINT `product_stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_stock_ibfk_2` FOREIGN KEY (`production_id`) REFERENCES `production_log` (`production_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- LEVEL 5: Triggers
-- ==========================================

DELIMITER ;;
CREATE TRIGGER `before_order_delete` BEFORE DELETE ON `orders` FOR EACH ROW BEGIN
    -- Revert inventory releases back to stock
    UPDATE inventory_stock ist
    INNER JOIN inventory_release ir ON ist.item_id = ir.item_id
    SET ist.quantity_available = ist.quantity_available + ir.quantity
    WHERE ir.order_id = OLD.order_id
    AND ir.status = 'released';

    -- For production orders, revert the product quantities
    IF OLD.order_type = 'PRODUCTION_ORDER' THEN
        UPDATE inventory_stock ist
        INNER JOIN order_product op ON ist.item_id = op.product_id
        SET ist.quantity_available = ist.quantity_available + op.quantity
        WHERE op.order_id = OLD.order_id;
    END IF;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE TRIGGER `after_production_log_insert` AFTER INSERT ON `production_log` FOR EACH ROW BEGIN
    DECLARE existing_stock_id INT;

    -- Check if product_stock entry exists for the given product
    SELECT stock_id INTO existing_stock_id
    FROM product_stock
    WHERE product_id = NEW.product_id
    LIMIT 1;

    IF existing_stock_id IS NOT NULL THEN
        -- If stock exists, update quantity and last_updated only (NOT production_id)
        UPDATE product_stock
        SET quantity_available = quantity_available + NEW.actual_quantity,
            last_updated = NOW()
        WHERE stock_id = existing_stock_id;
    ELSE
        -- If no stock exists, insert a new stock record including production_id
        INSERT INTO product_stock (product_id, production_id, quantity_available, last_updated)
        VALUES (NEW.product_id, NEW.production_id, NEW.actual_quantity, NOW());
    END IF;
END ;;
DELIMITER ;