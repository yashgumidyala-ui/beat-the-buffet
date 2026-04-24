import argparse
from pathlib import Path

import torch
import torch.nn as nn
import yaml
from torch.optim import AdamW

from ml.src.dataset import build_dataloaders
from ml.src.model import build_model, freeze_backbone, unfreeze_all


def load_config(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def run_epoch(model, loader, criterion, optimizer, device, train: bool):
    model.train(train)
    total_loss, total_correct, total_n = 0.0, 0, 0
    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        if train:
            optimizer.zero_grad()
        logits = model(imgs)
        loss = criterion(logits, labels)
        if train:
            loss.backward()
            optimizer.step()
        total_loss += loss.item() * imgs.size(0)
        total_correct += (logits.argmax(1) == labels).sum().item()
        total_n += imgs.size(0)
    return total_loss / total_n, total_correct / total_n


def main(config_path: str):
    cfg = load_config(config_path)
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"

    train_loader, val_loader, _, _ = build_dataloaders(cfg)
    model = build_model(cfg).to(device)
    criterion = nn.CrossEntropyLoss()

    freeze_backbone(model)
    optimizer = AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=cfg["train"]["lr_head"],
        weight_decay=cfg["train"]["weight_decay"],
    )
    for epoch in range(cfg["train"]["epochs_frozen"]):
        tl, ta = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        vl, va = run_epoch(model, val_loader, criterion, optimizer, device, train=False)
        print(f"[frozen {epoch+1}] train_loss={tl:.4f} train_acc={ta:.4f} val_loss={vl:.4f} val_acc={va:.4f}")

    unfreeze_all(model)
    optimizer = AdamW(
        model.parameters(),
        lr=cfg["train"]["lr_finetune"],
        weight_decay=cfg["train"]["weight_decay"],
    )
    best_val = 0.0
    ckpt_dir = Path(cfg["checkpoint"]["dir"])
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    for epoch in range(cfg["train"]["epochs_finetune"]):
        tl, ta = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        vl, va = run_epoch(model, val_loader, criterion, optimizer, device, train=False)
        print(f"[finetune {epoch+1}] train_loss={tl:.4f} train_acc={ta:.4f} val_loss={vl:.4f} val_acc={va:.4f}")
        if va > best_val:
            best_val = va
            torch.save(model.state_dict(), ckpt_dir / "best.pt")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="ml/configs/default.yaml")
    args = parser.parse_args()
    main(args.config)
