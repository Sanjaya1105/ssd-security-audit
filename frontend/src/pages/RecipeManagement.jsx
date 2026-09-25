import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const RecipeManagement = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    ingredients: [{ ingredient_item_id: '', quantity_required_per_unit: '' }]
  });

  // Authentication check on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !['admin', 'manager'].includes(user.role)) {
          navigate('/login');
          return;
        }
        fetchRecipes();
        fetchProducts();
        fetchInventoryItems();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/recipes', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setRecipes(response.data);
    } catch (err) {
      console.error('Fetch recipes error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view recipes');
        toast.error('You do not have permission to view recipes');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please check your internet connection.');
        toast.error('Network connection error');
      } else {
        setError('Failed to fetch recipes. Please try again.');
        toast.error('Failed to fetch recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/products', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Fetch products error:', err);
      toast.error('Failed to fetch products');
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/inventory-items', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setInventoryItems(response.data);
    } catch (err) {
      console.error('Fetch inventory items error:', err);
      toast.error('Failed to fetch inventory items');
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setFormData({
      ...formData,
      product_id: productId,
      ingredients: [{ ingredient_item_id: '', quantity_required_per_unit: '' }]
    });

    // If product is selected, fetch its existing recipes
    if (productId) {
      fetchProductRecipes(productId);
    }
  };

  const fetchProductRecipes = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/recipes/product/${productId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.length > 0) {
        // Convert existing recipes to ingredients array format
        const ingredients = response.data.map(recipe => ({
          ingredient_item_id: recipe.ingredient_item_id,
          quantity_required_per_unit: recipe.quantity_required_per_unit
        }));
        
        setFormData(prev => ({
          ...prev,
          ingredients
        }));
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error fetching product recipes:', err);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    setFormData({
      ...formData,
      ingredients: newIngredients
    });
  };

  const addIngredientField = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredient_item_id: '', quantity_required_per_unit: '' }]
    });
  };

  const removeIngredientField = (index) => {
    if (formData.ingredients.length === 1) return;
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      ingredients: newIngredients
    });
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      ingredients: [{ ingredient_item_id: '', quantity_required_per_unit: '' }]
    });
    setIsEditing(false);
    setError('');
  };

  const validateForm = () => {
    if (!formData.product_id) {
      setError('Product is required');
      return false;
    }
    
    for (const ingredient of formData.ingredients) {
      if (!ingredient.ingredient_item_id) {
        setError('All ingredients must be selected');
        return false;
      }
      if (!ingredient.quantity_required_per_unit || ingredient.quantity_required_per_unit <= 0) {
        setError('Valid quantity is required for all ingredients');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // If editing, first delete all existing recipes for this product
      if (isEditing) {
        const existingRecipes = recipes.filter(r => r.product_item_id === formData.product_id);
        await Promise.all(existingRecipes.map(recipe => 
          axios.delete(`http://localhost:3000/api/recipes/${recipe.product_item_id}/${recipe.ingredient_item_id}`, {
            withCredentials: true
          })
        ));
      }

      // Create all recipes for the product
      const promises = formData.ingredients.map(ingredient =>
        axios.post('http://localhost:3000/api/recipes', {
          product_item_id: formData.product_id,
          ingredient_item_id: ingredient.ingredient_item_id,
          quantity_required_per_unit: ingredient.quantity_required_per_unit
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(promises);
      toast.success(isEditing ? 'Recipe updated successfully' : 'Recipe created successfully');
      
      resetForm();
      fetchRecipes();
    } catch (err) {
      console.error('Recipe operation error:', err);
      toast.error(isEditing ? 'Failed to update recipe' : 'Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, ingredientId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:3000/api/recipes/${productId}/${ingredientId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      toast.success('Recipe deleted successfully');
      fetchRecipes();
    } catch (err) {
      console.error('Delete recipe error:', err);
      toast.error('Failed to delete recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productName, productRecipes) => {
    const productId = productRecipes[0].product_item_id;
    const ingredients = productRecipes.map(recipe => ({
      ingredient_item_id: recipe.ingredient_item_id,
      quantity_required_per_unit: recipe.quantity_required_per_unit
    }));

    setFormData({
      product_id: productId,
      ingredients
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group recipes by product
  const groupedRecipes = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.product_name]) {
      acc[recipe.product_name] = [];
    }
    acc[recipe.product_name].push(recipe);
    return acc;
  }, {});

  return (
    <div className="min-h-screen recipe-container">
      <div className="recipe-wrapper">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="recipe-title"
        >
          Recipe Management
        </motion.h1>

        {/* Add/Edit Recipe Form */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="recipe-form-container"
        >
          <div className="recipe-form-header">
            <h2 className="form-title">
              {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="cancel-button"
              >
                Cancel Editing
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="recipe-form">
            {/* Product Selection */}
            <div className="form-group">
              <label className="form-label">Product</label>
              <select
                value={formData.product_id}
                onChange={handleProductChange}
                className="form-select"
                required
                disabled={isEditing}
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ingredients List */}
            <div className="ingredients-container">
              <div className="ingredients-header">
                <h3 className="ingredients-title">Ingredients</h3>
                <button
                  type="button"
                  onClick={addIngredientField}
                  className="add-ingredient-btn"
                >
                  <FaPlus /> Add Ingredient
                </button>
              </div>

              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-item">
                  <div className="ingredient-field">
                    <label className="form-label">Ingredient</label>
                    <select
                      value={ingredient.ingredient_item_id}
                      onChange={(e) => handleIngredientChange(index, 'ingredient_item_id', e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="">Select Ingredient</option>
                      {inventoryItems.map(item => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.item_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ingredient-field">
                    <label className="form-label">Quantity Required per Unit</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={ingredient.quantity_required_per_unit}
                        onChange={(e) => handleIngredientChange(index, 'quantity_required_per_unit', e.target.value)}
                        className="form-input flex-1"
                        step="0.01"
                        min="0.01"
                        required
                      />
                      <span className="text-gray-400">
                        {inventoryItems.find(item => item.item_id === parseInt(ingredient.ingredient_item_id))?.unit || ''}
                      </span>
                    </div>
                  </div>

                  <div className="remove-btn-container">
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredientField(index)}
                        className="remove-ingredient-btn"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Recipe' : 'Add Recipe')}
            </button>
          </form>
        </motion.div>

        {/* Recipes List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="recipes-list-container"
        >
          <h2 className="recipes-list-title">Recipes List</h2>
          
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : (
            <div className="recipes-groups">
              {Object.entries(groupedRecipes).map(([productName, productRecipes]) => (
                <div key={productName} className="recipe-group">
                  <div className="recipe-group-header">
                    <h3 className="product-name">{productName}</h3>
                    <button
                      onClick={() => handleEdit(productName, productRecipes)}
                      className="edit-recipe-btn"
                    >
                      <FaEdit /> Edit Recipe
                    </button>
                  </div>
                  <table className="recipe-table">
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Quantity Required</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productRecipes.map((recipe) => (
                        <tr key={`${recipe.product_item_id}-${recipe.ingredient_item_id}`}>
                          <td>{recipe.ingredient_name}</td>
                          <td>{recipe.quantity_required_per_unit}</td>
                          <td>
                            <button
                              onClick={() => handleDelete(recipe.product_item_id, recipe.ingredient_item_id)}
                              className="delete-btn"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      <style>{`
        .recipe-container {
          background-color: #ffffff;
          color: #333333;
          padding: 2rem;
        }
        
        .recipe-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .recipe-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 2rem;
          color: #333333;
        }
        
        .recipe-form-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .recipe-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .form-title {
          font-size: 1.8rem;
          font-weight: 600;
        }
        
        .cancel-button {
          color: #666666;
          font-size: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.3s;
        }
        
        .cancel-button:hover {
          color: #333333;
        }
        
        .recipe-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-label {
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .form-select, .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #dddddd;
          border-radius: 6px;
          background-color: white;
          font-size: 1rem;
        }
        
        .form-select:focus, .form-input:focus {
          outline: none;
          border-color: #4d90fe;
          box-shadow: 0 0 0 2px rgba(77, 144, 254, 0.2);
        }
        
        .ingredients-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .ingredients-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ingredients-title {
          font-size: 1.5rem;
          font-weight: 500;
        }
        
        .add-ingredient-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #4CAF50;
          color: white;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .add-ingredient-btn:hover {
          background-color: #3e8e41;
        }
        
        .ingredient-item {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 1rem;
          background-color: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #eeeeee;
        }
        
        .ingredient-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .remove-btn-container {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }
        
        .remove-ingredient-btn {
          color: #ff4d4d;
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          transition: color 0.3s;
        }
        
        .remove-ingredient-btn:hover {
          color: #cc0000;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #f44336;
          padding: 1rem;
          border: 1px solid #f44336;
          border-radius: 6px;
        }
        
        .submit-btn {
          width: 100%;
          background-color: #4CAF50;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease-in-out, transform 0.2s;
        }
        
        .submit-btn:hover {
          background-color: #3e8e41;
          transform: scale(1.01);
        }
        
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .recipes-list-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .recipes-list-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .loading-text {
          text-align: center;
          padding: 1.5rem;
          font-size: 1.2rem;
          color: #666666;
        }
        
        .recipes-groups {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .recipe-group {
          background-color: white;
          border-radius: 6px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .recipe-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .product-name {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333333;
        }
        
        .edit-recipe-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #2196F3;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          transition: color 0.3s;
        }
        
        .edit-recipe-btn:hover {
          color: #0b7dda;
        }
        
        .recipe-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .recipe-table th {
          text-align: left;
          padding: 1rem;
          font-size: 20px;
          font-weight: 600;
          border-bottom: 2px solid #eeeeee;
          color: #333333;
        }
        
        .recipe-table td {
          padding: 1rem;
          font-size: 18px;
          border-bottom: 1px solid #eeeeee;
        }
        
        .delete-btn {
          color: #ff4d4d;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          transition: color 0.3s;
        }
        
        .delete-btn:hover {
          color: #cc0000;
        }
        
        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .ingredient-item {
            grid-template-columns: 1fr;
          }
          
          .remove-btn-container {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default RecipeManagement; 