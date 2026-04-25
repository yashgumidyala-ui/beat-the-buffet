import numpy as np
from PIL import Image
from ultralytics import YOLOWorld


DEFAULT_PROMPTS = [
    "sushi roll",
    "maki roll",
    "nigiri",
    "sashimi slice",
    "piece of sushi",
    "rice ball wrapped in seaweed",
    "raw fish slice",
    "salmon slice",
    "tuna slice",
    "piece of raw fish",
    "fish fillet on plate",
]


def build_detector(prompts: list[str] | None = None, weights: str = "yolov8l-world.pt") -> YOLOWorld:
    model = YOLOWorld(weights)
    model.set_classes(prompts or DEFAULT_PROMPTS)
    return model


def _iou(a: tuple, b: tuple) -> float:
    ax1, ay1, ax2, ay2 = a[:4]
    bx1, by1, bx2, by2 = b[:4]
    iw = max(0, min(ax2, bx2) - max(ax1, bx1))
    ih = max(0, min(ay2, by2) - max(ay1, by1))
    inter = iw * ih
    union = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - inter
    return inter / union if union > 0 else 0.0


def _nms(boxes: list[tuple], iou_thresh: float) -> list[tuple]:
    kept: list[tuple] = []
    for box in sorted(boxes, key=lambda b: -b[4]):
        if all(_iou(box, k) < iou_thresh for k in kept):
            kept.append(box)
    return kept


def detect_pieces(
    model: YOLOWorld,
    image: Image.Image,
    conf: float = 0.01,
    iou: float = 0.45,
    max_det: int = 50,
) -> list[tuple[int, int, int, int, float]]:
    arr = np.array(image)
    results = model.predict(
        arr, conf=conf, iou=iou, max_det=max_det, agnostic_nms=True, verbose=False
    )
    raw: list[tuple[int, int, int, int, float]] = []
    for r in results:
        for b in r.boxes:
            x1, y1, x2, y2 = b.xyxy[0].tolist()
            raw.append((int(x1), int(y1), int(x2), int(y2), float(b.conf[0])))
    boxes = _nms(raw, iou_thresh=iou)
    print(f"[detector] {len(raw)} raw → {len(boxes)} after NMS (conf>={conf}, iou<{iou})")
    return boxes
