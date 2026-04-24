from pathlib import Path
import csv
import random

from PIL import Image
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms


def load_labels(labels_csv: str) -> dict[str, int]:
    mapping = {}
    with open(labels_csv, newline="") as f:
        for row in csv.DictReader(f):
            mapping[row["class_name"]] = int(row["class_id"])
    return mapping


def build_transforms(image_size: int, train: bool, aug: dict):
    if train:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=aug["hflip_prob"]),
            transforms.RandomRotation(aug["rotation_deg"]),
            transforms.ColorJitter(
                brightness=aug["color_jitter"],
                contrast=aug["color_jitter"],
                saturation=aug["color_jitter"],
            ),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


class SushiDataset(Dataset):
    def __init__(self, root: str, labels: dict[str, int], transform=None):
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []
        root_path = Path(root)
        for class_name, class_id in labels.items():
            class_dir = root_path / class_name
            if not class_dir.exists():
                continue
            for img_path in class_dir.iterdir():
                if img_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    self.samples.append((img_path, class_id))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


def build_dataloaders(cfg: dict):
    labels = load_labels(cfg["data"]["labels_csv"])
    train_tf = build_transforms(cfg["data"]["image_size"], train=True, aug=cfg["augment"])
    eval_tf = build_transforms(cfg["data"]["image_size"], train=False, aug=cfg["augment"])

    full = SushiDataset(cfg["data"]["raw_dir"], labels, transform=train_tf)
    n = len(full)
    n_val = int(n * cfg["data"]["val_split"])
    n_test = int(n * cfg["data"]["test_split"])
    n_train = n - n_val - n_test

    gen = random.Random(cfg["data"]["seed"])
    indices = list(range(n))
    gen.shuffle(indices)
    train_ds, val_ds, test_ds = random_split(full, [n_train, n_val, n_test])

    val_ds.dataset.transform = eval_tf  # shared dataset; see train.py for cleaner split

    bs = cfg["train"]["batch_size"]
    nw = cfg["train"]["num_workers"]
    return (
        DataLoader(train_ds, batch_size=bs, shuffle=True, num_workers=nw),
        DataLoader(val_ds, batch_size=bs, shuffle=False, num_workers=nw),
        DataLoader(test_ds, batch_size=bs, shuffle=False, num_workers=nw),
        labels,
    )
