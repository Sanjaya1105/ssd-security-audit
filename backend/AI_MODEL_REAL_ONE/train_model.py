# train_model.py

import pandas as pd
import mysql.connector
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
import joblib

# 1. Connect to MySQL
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='ni@123',
    database='hotandfast2'
)

# 2. Run your SQL query
query = """
SELECT DATE(date) AS date, product_id, product_name, SUM(total_quantity) AS total_quantity
FROM (
    SELECT DATE(s.sale_date) AS date, p.product_id, p.product_name, si.quantity AS total_quantity
    FROM sales s
    JOIN sale_items si ON s.sale_id = si.sale_id
    JOIN product p ON si.product_id = p.product_id
    UNION ALL
    SELECT DATE(o.date), p.product_id, p.product_name, op.quantity
    FROM orders o
    JOIN order_product op ON o.order_id = op.order_id
    JOIN product p ON op.product_id = p.product_id
) combined
GROUP BY date, product_id, product_name
ORDER BY date;
"""

df = pd.read_sql(query, conn)
conn.close()

# 3. Save CSV for reference
df.to_csv("daily_sales_summary.csv", index=False)

# 4. Feature Engineering
df['date'] = pd.to_datetime(df['date'])
df['day'] = df['date'].dt.day
df['month'] = df['date'].dt.month
df['weekday'] = df['date'].dt.weekday

X = df[['product_id', 'day', 'month', 'weekday']]
y = df['total_quantity']

# 5. Create pipeline
preprocessor = ColumnTransformer([
    ('product_encoder', OneHotEncoder(handle_unknown='ignore'), ['product_id'])
], remainder='passthrough')

model = Pipeline([
    ('prep', preprocessor),
    ('rf', RandomForestRegressor(n_estimators=100, random_state=42))
])

# 6. Train and save model
model.fit(X, y)
joblib.dump(model, 'sales_model.pkl')
print(" Model trained and saved!")
