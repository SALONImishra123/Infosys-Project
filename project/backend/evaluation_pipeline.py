import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

REPORTS_FOLDER = "backend/reports"
if not os.path.exists(REPORTS_FOLDER):
    os.makedirs(REPORTS_FOLDER)

# ---------- Helper: Versioned filenames ----------
def get_versioned_filename(base_name, ext="csv", folder=REPORTS_FOLDER):
    i = 1
    while True:
        filename = os.path.join(folder, f"{base_name}_v{i}.{ext}")
        if not os.path.exists(filename):
            return filename
        i += 1

# ---------- Load Test Data ----------
def load_test_data(file_path):
    ext = os.path.splitext(file_path)[-1].lower()
    if ext == ".json":
        with open(file_path, "r") as f:
            data = json.load(f)
        return data["y_true"], data["y_pred"], data.get("labels", [])
    elif ext == ".csv":
        df = pd.read_csv(file_path)
        return df["y_true"].tolist(), df["y_pred"].tolist(), []
    else:
        raise ValueError("Unsupported file format. Use JSON or CSV.")

# ---------- Evaluation ----------
def evaluate_model(y_true, y_pred):
    metrics = {
        "Accuracy": accuracy_score(y_true, y_pred),
        "Precision": precision_score(y_true, y_pred, average="weighted"),
        "Recall": recall_score(y_true, y_pred, average="weighted"),
        "F1-Score": f1_score(y_true, y_pred, average="weighted")
    }
    return metrics

# ---------- Confusion Matrix ----------
def plot_confusion_matrix(y_true, y_pred, labels, save_path):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(6, 4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=labels, yticklabels=labels)
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title("Confusion Matrix")
    plt.savefig(save_path)
    plt.close()
    print(f"[INFO] Confusion matrix saved at {save_path}")

# ---------- Save versioned metadata ----------
def save_model_metadata(model_name, dataset, metrics, folder=REPORTS_FOLDER):
    i = 1
    while True:
        filename = os.path.join(folder, f"model_metadata_v{i}.json")
        if not os.path.exists(filename):
            break
        i += 1
    metadata = {
        "version": i,
        "model_name": model_name,
        "dataset": dataset,
        "metrics": metrics,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(filename, "w") as f:
        json.dump(metadata, f, indent=4)
    print(f"[INFO] Metadata saved at {filename}")
    return filename

# ---------- Export Metrics ----------
def export_metrics_to_csv(metrics, filename):
    df = pd.DataFrame([metrics])
    df.to_csv(filename, index=False)
    print(f"[INFO] Metrics exported to {filename}")

def export_metrics_to_pdf(metrics, filename):
    c = canvas.Canvas(filename, pagesize=letter)
    c.drawString(100, 750, "Evaluation Report")
    y = 700
    for k, v in metrics.items():
        c.drawString(100, y, f"{k}: {v:.4f}")
        y -= 20
    c.save()
    print(f"[INFO] Metrics exported to {filename}")

# ---------- MAIN PIPELINE ----------
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate model from test results")
    parser.add_argument("test_file", type=str, nargs="?", default="backend/test_results.json")
    args = parser.parse_args()

    y_true, y_pred, labels = load_test_data(args.test_file)
    if not labels:
        labels = sorted(set(y_true) | set(y_pred))

    metrics = evaluate_model(y_true, y_pred)
    print("\nEvaluation Metrics:", metrics)

    cm_path = get_versioned_filename("confusion_matrix", "png")
    plot_confusion_matrix(y_true, y_pred, labels, save_path=cm_path)

    metadata_path = save_model_metadata("transformer_v1", "intent_dataset_v2", metrics)

    # Export metrics for frontend
    json_path = os.path.join(REPORTS_FOLDER, "latest_metrics.json")
    with open(json_path, "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"[INFO] Latest metrics exported to {json_path}")
