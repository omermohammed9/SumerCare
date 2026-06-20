import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

def generate_synthetic_data(num_records=1000):
    np.random.seed(42)
    
    # Features:
    # age: 18 - 90
    # previous_no_shows: 0 - 5
    # days_until_appointment: 0 - 60
    # is_weekend: 0 or 1
    
    ages = np.random.randint(18, 90, num_records)
    previous_no_shows = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.7, 0.15, 0.08, 0.04, 0.02, 0.01], size=num_records)
    days_until_appointment = np.random.randint(1, 60, num_records)
    is_weekend = np.random.choice([0, 1], p=[0.8, 0.2], size=num_records)
    
    # Create target (1 = No Show, 0 = Showed Up)
    # Higher probability if previous_no_shows is high, or days_until_appointment is high
    no_show_prob = (
        0.05 +
        (previous_no_shows * 0.1) +
        (days_until_appointment / 60) * 0.1 +
        (is_weekend * 0.05)
    )
    
    no_show_prob = np.clip(no_show_prob, 0, 1)
    target = np.random.binomial(1, no_show_prob)
    
    df = pd.DataFrame({
        'age': ages,
        'previous_no_shows': previous_no_shows,
        'days_until_appointment': days_until_appointment,
        'is_weekend': is_weekend,
        'no_show': target
    })
    return df

def train_model():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(5000)
    
    X = df[['age', 'previous_no_shows', 'days_until_appointment', 'is_weekend']]
    y = df['no_show']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Model accuracy on synthetic test set: {acc:.2f}")
    
    # Save the model
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    joblib.dump(model, 'no_show_model.pkl')
    print("Model saved to no_show_model.pkl")

if __name__ == "__main__":
    train_model()
