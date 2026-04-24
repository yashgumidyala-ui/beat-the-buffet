import timm
import torch.nn as nn


def build_model(cfg: dict) -> nn.Module:
    model = timm.create_model(
        cfg["model"]["backbone"],
        pretrained=cfg["model"]["pretrained"],
        num_classes=cfg["model"]["num_classes"],
        drop_rate=cfg["model"]["dropout"],
    )
    return model


def freeze_backbone(model: nn.Module) -> None:
    classifier = model.get_classifier()
    for p in model.parameters():
        p.requires_grad = False
    for p in classifier.parameters():
        p.requires_grad = True


def unfreeze_all(model: nn.Module) -> None:
    for p in model.parameters():
        p.requires_grad = True
