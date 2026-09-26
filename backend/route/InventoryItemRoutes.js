const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");
const {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
    getItemsByCategory,
    getAllCategories,
    createCategory
} = require("../controller/InventoryItemController");

const managers = [authenticateUser, authorizeRole(["admin", "manager"])];
const staff = [authenticateUser, authorizeRole(["admin", "manager", "cashier"])];

router.post("/", ...managers, createItem);
router.post("/categories", ...managers, createCategory);
router.get("/", ...staff, getAllItems);
router.get("/categories", ...staff, getAllCategories);
router.get("/category/:category", ...staff, getItemsByCategory);
router.get("/:itemId", ...staff, getItemById);
router.put("/:itemId", ...managers, updateItem);
router.delete("/:itemId", ...managers, deleteItem);

module.exports = router;
