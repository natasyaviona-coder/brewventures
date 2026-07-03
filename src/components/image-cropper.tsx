"use client";

import * as React from "react";
import Cropper, { Area } from "react-easy-crop";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
};

async function cropImage(imageSrc: string, area: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageSrc;
  });

  const outSize = Math.min(400, Math.round(Math.max(area.width, area.height)));
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outSize,
    outSize,
  );

  let quality = 0.75;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 45000 && quality > 0.3) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

export function ImageCropper({ open, imageSrc, onCancel, onCropped }: Props) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [area, setArea] = React.useState<Area | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setArea(null);
    }
  }, [open, imageSrc]);

  async function handleConfirm() {
    if (!imageSrc || !area) return;
    setBusy(true);
    try {
      const dataUrl = await cropImage(imageSrc, area);
      onCropped(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open && !!imageSrc}
      onClose={busy ? () => {} : onCancel}
      title="Crop to square"
      description="Drag to reposition, pinch or use the slider to zoom."
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPx) => setArea(areaPx)}
              showGrid
              objectFit="contain"
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)] w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--primary)]"
          />
          <span className="text-xs w-10 text-right tabular-nums">{zoom.toFixed(2)}×</span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!area || busy}>
            {busy ? "Cropping…" : "Crop & scan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
