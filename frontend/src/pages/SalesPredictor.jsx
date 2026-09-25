import { useState } from 'react';
import axios from '../config/axiosConfig';

function SalesPredictor() {
  const [date, setDate] = useState('');
  const [prediction, setPrediction] = useState('');

  const handlePredict = async () => {
    try {
      const response = await axios.post('/predict-sales', { sale_date: date });
      setPrediction(response.data.predicted_quantity);
    } catch (error) {
      console.error('Prediction Error', error);
      alert('Prediction failed');
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <div className="max-w-md mx-auto bg-gray-700 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Sales Predictor</h2>
        <div className="mb-6">
          <label className="block mb-2">Select Date:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 bg-gray-600 rounded text-white" 
          />
        </div>
        <button 
          onClick={handlePredict}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Predict
        </button>
        {prediction && (
          <div className="mt-6 p-4 bg-gray-600 rounded">
            <p className="text-xl">Predicted Quantity: <span className="font-bold">{prediction}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesPredictor;
