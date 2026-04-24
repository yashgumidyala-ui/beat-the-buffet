import argparse

import torch
import yaml
from PIL import Image

from ml.src.dataset import build_transforms, load_labels
from ml.src.model import build_model


def predict(image_path: str, config_path: str, checkpoint: str, top_k: int = 3):
    with open(config_path) as f:
        cfg = yaml.safe_load(f)
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"

    labels = load_labels(cfg["data"]["labels_csv"])
    id_to_name = {v: k for k, v in labels.items()}

    model = build_model(cfg).to(device)
    model.load_state_dict(torch.load(checkpoint, map_location=device))
    model.eval()

    tf = build_transforms(cfg["data"]["image_size"], train=False, aug=cfg["augment"])
    img = tf(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)

    with torch.no_grad():
        probs = torch.softmax(model(img), dim=1)[0]
    top = torch.topk(probs, k=top_k)
    return [
        {"label": id_to_name[int(i)], "confidence": float(p)}
        for p, i in zip(top.values, top.indices)
    ]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image")
    parser.add_argument("--config", default="ml/configs/default.yaml")
    parser.add_argument("--checkpoint", default="ml/checkpoints/best.pt")
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()
    for row in predict(args.image, args.config, args.checkpoint, args.top_k):
        print(f"{row['label']:<25} {row['confidence']:.3f}")
