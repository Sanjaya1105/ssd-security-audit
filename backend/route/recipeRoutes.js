const express = require("express");
const router = express.Router();
const {
    getAllRecipes,
    getRecipeByProductId,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require("../controller/recipeController");
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");

const managers = [authenticateUser, authorizeRole(["admin", "manager"])];

router.get("/", ...managers, getAllRecipes);
router.get("/product/:productId", ...managers, getRecipeByProductId);
router.post("/", ...managers, createRecipe);
router.put("/:product_item_id/:ingredient_item_id", ...managers, updateRecipe);
router.delete("/:product_item_id/:ingredient_item_id", ...managers, deleteRecipe);

module.exports = router;
