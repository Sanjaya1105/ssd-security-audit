const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");
const ProductInventoryRelease = require("../controller/ProductInventoryRelease");

const staff = [authenticateUser, authorizeRole(["admin", "manager", "cashier"])];
const managers = [authenticateUser, authorizeRole(["admin", "manager"])];

router.post("/", ...managers, ProductInventoryRelease.create);
router.get("/", ...staff, ProductInventoryRelease.getAll);
router.get("/:id", ...staff, ProductInventoryRelease.getById);
router.delete("/:id", ...managers, ProductInventoryRelease.delete);

module.exports = router;
