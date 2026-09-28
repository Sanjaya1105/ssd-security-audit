import joblib
import pandas as pd
import sys
import json
import mysql.connector
from db_config import mysql_config

# Connect to MySQL using credentials from backend/.env (not hardcoded)
conn = mysql.connector.connect(**mysql_config())

# Load model
model = joblib.load('sales_model.pkl')

# Get date from argument
date = sys.argv[1]

# Convert to datetime object
target_date = pd.to_datetime(date)

# Get all product_ids
products_df = pd.read_sql("SELECT DISTINCT product_id FROM product", conn)

results = []

for _, row in products_df.iterrows():
    product_id = row['product_id']
    
    # Prepare features
    X_pred = pd.DataFrame({
    'product_id': [product_id],
    'weekday': [target_date.dayofweek],
    'day': [target_date.day],
    'month': [target_date.month]
})

    # Predict
    predicted_qty = int(model.predict(X_pred)[0])
    
    results.append({
        'product_id': int(product_id),
        'predicted_quantity': predicted_qty
    })

print(json.dumps(results))
