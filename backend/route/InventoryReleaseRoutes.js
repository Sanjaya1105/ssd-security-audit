const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");
const {
    createInventoryRelease,
    getAllInventoryReleases,
    getInventoryReleaseById,
    getInventoryReleasesByOrder,
    updateInventoryRelease,
    deleteInventoryRelease
} = require("../controller/InventoryReleaseController");

const staff = [authenticateUser, authorizeRole(["admin", "manager", "cashier"])];
const managers = [authenticateUser, authorizeRole(["admin", "manager"])];

router.post("/", ...managers, createInventoryRelease);
router.get("/", ...staff, getAllInventoryReleases);
router.get("/order/:orderId", ...staff, getInventoryReleasesByOrder);
router.get("/:releaseId", ...staff, getInventoryReleaseById);
router.put("/:releaseId", ...managers, updateInventoryRelease);
router.delete("/:releaseId", ...managers, deleteInventoryRelease);

module.exports = router;
