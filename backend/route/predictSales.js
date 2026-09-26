const express = require('express');
const { PythonShell } = require('python-shell');
const { authenticateUser, authorizeRole } = require('../middleware/AuthMiddleware');

router.post('/predict-sales', authenticateUser, authorizeRole(['admin', 'manager']), (req, res) => {
  const { sale_date } = req.body;
  console.log('Running Python script...');

  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './ml_models', // path where predict_sales.py is located
    args: [sale_date]
  };

  PythonShell.run('predict_sales.py', options, function (err, results) {
    if (err) {
      console.error('Prediction Error:', err);
      return res.status(500).send('Prediction error');
    }
    console.log('Python Result:', results);  // <-- ADD THIS
    res.json({ predicted_quantity: results[0] });
  });
});

module.exports = router;
