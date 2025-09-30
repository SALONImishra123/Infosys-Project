import json
import pandas as pd
import random
import os

# Number of samples and classes
num_samples = 20
num_classes = 3  # for example: 0,1,2

# Labels (optional)
labels = ["Intent A", "Intent B", "Intent C"]

# Generate random true labels and predictions
y_true = [random.randint(0, num_classes - 1) for _ in range(num_samples)]
y_pred = [random.randint(0, num_classes - 1) for _ in range(num_samples)]

# --- Save as CSV ---
df = pd.DataFrame({"y_true": y_true, "y_pred": y_pred})
os.makedirs("backend", exist_ok=True)
csv_path = "backend/test_results.csv"
df.to_csv(csv_path, index=False)
print(f"[INFO] CSV test dataset saved at {csv_path}")

# --- Save as JSON ---
json_path = "backend/test_results.json"
with open(json_path, "w") as f:
    json.dump({"y_true": y_true, "y_pred": y_pred, "labels": labels}, f, indent=4)
print(f"[INFO] JSON test dataset saved at {json_path}")
