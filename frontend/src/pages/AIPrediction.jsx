import { useState, useEffect } from 'react';
import axios from '../config/axiosConfig';
import { motion } from 'framer-motion';

function AIPrediction() {
  const [date, setDate] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('');
  const [productNames, setProductNames] = useState({});

  const handlePredict = async () => {
    if (!date) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');
    setPredictions([]);

    try {
      const response = await axios.get(`http://localhost:3000/predict?date=${date}`);
      setPredictions(response.data);
      
      // Extract product IDs from the predictions
      const productIds = response.data.map(item => item.product_id).join(',');
      
      // Fetch product names if we have predictions
      if (response.data.length > 0) {
        try {
          const namesResponse = await axios.get(`http://localhost:3000/api/products/names-by-ids?ids=${productIds}`);
          setProductNames(namesResponse.data);
        } catch (err) {
          console.error('Error fetching product names:', err);
        }
      }
    } catch (err) {
      console.error('Prediction Error:', err);
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    setTrainingStatus('Training in progress...');
    try {
      const response = await axios.get('http://localhost:3000/train-model');
      setTrainingStatus(response.data.message);
    } catch (err) {
      console.error('Training Error:', err);
      setTrainingStatus('Training failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Get product name from the productNames object, or fall back to ID if not found
  const getProductName = (productId) => {
    return productNames[productId] || `Product ${productId}`;
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8 text-center"
        >
          AI Sales Prediction
        </motion.h1>
        
        {/* Date Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-100 p-6 rounded-lg mb-8 shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4">Select Prediction Date</h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-lg">Date:</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-lg w-full" 
            />
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Predict Button */}
            <button 
              onClick={handlePredict}
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors text-xl font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Predicting...
                </span>
              ) : 'Predict Sales'}
            </button>
            
            {/* Train Model Button */}
            <button 
              onClick={handleTrainModel}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors text-xl font-semibold"
            >
              Train Model
            </button>
          </div>
          
          {/* Training Status */}
          {trainingStatus && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-lg text-green-700">{trainingStatus}</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <p className="text-lg">{error}</p>
            </div>
          )}
        </motion.div>
        
        {/* Prediction Results */}
        {predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 p-8 rounded-lg shadow-md"
          >
            <h3 className="text-2xl font-bold mb-6 text-blue-800 text-center">Prediction Results for {date}</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-blue-200 px-6 py-3 text-left text-lg font-semibold">Product</th>
                    <th className="border border-blue-200 px-6 py-3 text-left text-lg font-semibold">Predicted Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((item, index) => (
                    <tr 
                      key={index} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                    >
                      <td className="border border-blue-200 px-6 py-4 text-lg">
                        {getProductName(item.product_id)}
                      </td>
                      <td className="border border-blue-200 px-6 py-4 font-medium text-lg text-blue-700">
                        {item.predicted_quantity} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-lg">
                These predictions are based on historical sales data and can help with inventory planning.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AIPrediction; 