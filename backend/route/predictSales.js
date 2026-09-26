const express = require('express');
const { PythonShell } = require('python-shell');
const router = express.Router();


const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;


function isSafeIsoDate(value) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

router.post('/predict-sales', authenticateUser, authorizeRole(['admin', 'manager']), (req, res) => {
  const { sale_date } = req.body;
  if (!isSafeIsoDate(sale_date)) {
    return res.status(400).json({ message: 'sale_date must be a valid YYYY-MM-DD value' });
  }

  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './ml_models',
    args: [sale_date]
  };

  PythonShell.run('predict_sales.py', options, function (err, results) {
    if (err) {
      console.error('Prediction Error:', err);
      return res.status(500).send('Prediction error');
    }
    res.json({ predicted_quantity: results[0] });
  });
});

module.exports = router;
