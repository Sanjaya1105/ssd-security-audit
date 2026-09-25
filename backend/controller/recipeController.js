// Get all recipes
const getAllRecipes = async (req, res) => {
    try {
        const [recipes] = await req.db.promise().query(`
            SELECT r.*, 
                   p.product_name as product_name,
                   i.item_name as ingredient_name
            FROM recipe r
            JOIN product p ON r.product_item_id = p.product_id
            JOIN inventory_item i ON r.ingredient_item_id = i.item_id
            ORDER BY p.product_name, i.item_name
        `);
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ message: 'Error fetching recipes', error: error.message });
    }
};

// Get recipe by product ID
const getRecipeByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const [recipes] = await req.db.promise().query(`
            SELECT r.*, 
                   p.product_name as product_name,
                   i.item_name as ingredient_name
            FROM recipe r
            JOIN product p ON r.product_item_id = p.product_id
            JOIN inventory_item i ON r.ingredient_item_id = i.item_id
            WHERE r.product_item_id = ?
            ORDER BY i.item_name
        `, [productId]);

        if (recipes.length === 0) {
            return res.status(404).json({ message: 'No recipes found for this product' });
        }
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ message: 'Error fetching recipe', error: error.message });
    }
};

// Create new recipe
const createRecipe = async (req, res) => {
    try {
        const { product_item_id, ingredient_item_id, quantity_required_per_unit } = req.body;

        // Validate input
        if (!product_item_id || !ingredient_item_id || quantity_required_per_unit === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if product exists
        const [product] = await req.db.promise().query('SELECT product_id FROM product WHERE product_id = ?', [product_item_id]);
        
        // Check if ingredient exists
        const [ingredient] = await req.db.promise().query('SELECT item_id FROM inventory_item WHERE item_id = ?', [ingredient_item_id]);

        if (product.length === 0 || ingredient.length === 0) {
            return res.status(404).json({ message: 'Product or ingredient not found' });
        }

        // Use REPLACE INTO instead of INSERT to handle duplicates
        const [result] = await req.db.promise().query(
            'REPLACE INTO recipe (product_item_id, ingredient_item_id, quantity_required_per_unit) VALUES (?, ?, ?)',
            [product_item_id, ingredient_item_id, quantity_required_per_unit]
        );

        res.status(201).json({
            message: 'Recipe created/updated successfully',
            recipe_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ message: 'Error creating recipe', error: error.message });
    }
};

// Update recipe
const updateRecipe = async (req, res) => {
    try {
        const { product_item_id, ingredient_item_id } = req.params;
        const { quantity_required_per_unit } = req.body;

        // Validate input
        if (quantity_required_per_unit === undefined) {
            return res.status(400).json({ message: 'Quantity is required' });
        }

        // Check if recipe exists
        const [existing] = await req.db.promise().query(
            'SELECT * FROM recipe WHERE product_item_id = ? AND ingredient_item_id = ?',
            [product_item_id, ingredient_item_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Update recipe
        await req.db.promise().query(
            'UPDATE recipe SET quantity_required_per_unit = ? WHERE product_item_id = ? AND ingredient_item_id = ?',
            [quantity_required_per_unit, product_item_id, ingredient_item_id]
        );

        res.json({ message: 'Recipe updated successfully' });
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ message: 'Error updating recipe', error: error.message });
    }
};

// Delete recipe
const deleteRecipe = async (req, res) => {
    try {
        const { product_item_id, ingredient_item_id } = req.params;

        // Check if recipe exists
        const [existing] = await req.db.promise().query(
            'SELECT * FROM recipe WHERE product_item_id = ? AND ingredient_item_id = ?',
            [product_item_id, ingredient_item_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Delete recipe
        await req.db.promise().query(
            'DELETE FROM recipe WHERE product_item_id = ? AND ingredient_item_id = ?',
            [product_item_id, ingredient_item_id]
        );

        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ message: 'Error deleting recipe', error: error.message });
    }
};

module.exports = {
    getAllRecipes,
    getRecipeByProductId,
    createRecipe,
    updateRecipe,
    deleteRecipe
}; 