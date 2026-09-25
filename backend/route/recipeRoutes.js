const express = require('express');
const router = express.Router();
const {
    getAllRecipes,
    getRecipeByProductId,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require('../controller/recipeController');

// Get all recipes
router.get('/', getAllRecipes);

// Get recipe by product ID
router.get('/product/:productId', getRecipeByProductId);

// Create new recipe
router.post('/', createRecipe);

// Update recipe
router.put('/:product_item_id/:ingredient_item_id', updateRecipe);

// Delete recipe
router.delete('/:product_item_id/:ingredient_item_id', deleteRecipe);

module.exports = router; 