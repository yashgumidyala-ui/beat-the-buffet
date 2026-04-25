"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { identify } from "@/lib/api";
import type { IdentifyResponse } from "@/lib/types";

interface Props {
  location: string;
  onCapture: (result: IdentifyResponse) => void;
}

const BOX_COLOR = "#EF4444";

export function CameraCapture({ location, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const hiddenRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Camera unavailable");
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  function drawBoxes(bitmap: ImageBitmap, boxes: number[][]) {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);

    const lineWidth = Math.max(2, Math.round(bitmap.width / 250));
    const fontPx = Math.max(14, Math.round(bitmap.width / 40));
    ctx.lineWidth = lineWidth;
    ctx.font = `bold ${fontPx}px system-ui, sans-serif`;
    ctx.textBaseline = "top";

    boxes.forEach((box, i) => {
      const [x1, y1, x2, y2] = box;
      ctx.strokeStyle = BOX_COLOR;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      const num = String(i + 1);
      const w = ctx.measureText(num).width + 12;
      const h = fontPx + 8;
      ctx.fillStyle = BOX_COLOR;
      ctx.fillRect(x1, y1, w, h);
      ctx.fillStyle = "#fff";
      ctx.fillText(num, x1 + 6, y1 + 4);
    });
  }

  async function capture() {
    const video = videoRef.current;
    const hidden = hiddenRef.current;
    if (!video || !hidden || !video.videoWidth) {
      setStatus("Camera not ready yet — wait a moment.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Analyzing image...");

    hidden.width = video.videoWidth;
    hidden.height = video.videoHeight;
    hidden.getContext("2d")!.drawImage(video, 0, 0);
    const blob: Blob = await new Promise((r) => hidden.toBlob((b) => r(b!), "image/jpeg", 0.9));

    try {
      const result = await identify(blob, location);
      const bitmap = await createImageBitmap(blob);
      drawBoxes(bitmap, result.boxes || []);
      setShowingResult(true);
      setStatus("");
      if (result.error) setError("LLM: " + result.error);
      else onCapture(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    setShowingResult(false);
    setStatus("");
    setError(null);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: showingResult ? "none" : "block" }}
        />
        <canvas
          ref={previewRef}
          className="w-full h-full object-cover"
          style={{ display: showingResult ? "block" : "none" }}
        />
        <canvas ref={hiddenRef} className="hidden" />
      </div>

      <div className="flex gap-2 mt-3">
        {showingResult ? (
          <Button variant="secondary" onClick={retake} className="flex-1">
            <RotateCcw className="size-4 mr-2" /> Retake
          </Button>
        ) : (
          <Button onClick={capture} disabled={busy} className="flex-1">
            <Camera className="size-5 mr-2" /> {busy ? "Analyzing..." : "Capture plate"}
          </Button>
        )}
      </div>

      {status && <p className="text-sm text-gray-500 mt-2">{status}</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
