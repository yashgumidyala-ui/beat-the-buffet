import argparse

import torch
import yaml
from sklearn.metrics import classification_report, confusion_matrix

from ml.src.dataset import build_dataloaders
from ml.src.model import build_model


def main(config_path: str, checkpoint: str):
    with open(config_path) as f:
        cfg = yaml.safe_load(f)
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"

    _, _, test_loader, labels = build_dataloaders(cfg)
    model = build_model(cfg).to(device)
    model.load_state_dict(torch.load(checkpoint, map_location=device))
    model.eval()

    y_true, y_pred = [], []
    with torch.no_grad():
        for imgs, targets in test_loader:
            imgs = imgs.to(device)
            preds = model(imgs).argmax(1).cpu().tolist()
            y_true.extend(targets.tolist())
            y_pred.extend(preds)

    id_to_name = {v: k for k, v in labels.items()}
    names = [id_to_name[i] for i in range(len(labels))]
    print(classification_report(y_true, y_pred, target_names=names, digits=3))
    print("confusion matrix:")
    print(confusion_matrix(y_true, y_pred))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="ml/configs/default.yaml")
    parser.add_argument("--checkpoint", default="ml/checkpoints/best.pt")
    args = parser.parse_args()
    main(args.config, args.checkpoint)
