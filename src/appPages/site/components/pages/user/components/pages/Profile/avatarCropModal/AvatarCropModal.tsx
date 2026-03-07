"use client";

import {
  ChangeEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  WheelEvent,
} from "react";
import { FiUpload, FiX } from "react-icons/fi";
import scss from "./AvatarCropModal.module.scss";

interface AvatarCropModalProps {
  isOpen: boolean;
  initialImage: string | null;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const AvatarCropModal = ({
  isOpen,
  initialImage,
  onClose,
  onApply,
}: AvatarCropModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const [source, setSource] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const resetState = useCallback(() => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setIsDragging(false);
    setError("");
  }, []);

  const loadImage = useCallback(
    (src: string) => {
      const nextImage = new window.Image();
      nextImage.onload = () => {
        setImage(nextImage);
        setSource(src);
        resetState();
      };
      nextImage.onerror = () => {
        setError("Не удалось прочитать изображение");
      };
      nextImage.src = src;
    },
    [resetState],
  );

  const getBounds = useCallback(
    (targetImage: HTMLImageElement, targetZoom: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { maxX: 0, maxY: 0 };
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const baseScale = Math.max(width / targetImage.width, height / targetImage.height);
      const scale = baseScale * targetZoom;
      const drawWidth = targetImage.width * scale;
      const drawHeight = targetImage.height * scale;

      return {
        maxX: Math.max(0, (drawWidth - width) / 2),
        maxY: Math.max(0, (drawHeight - height) / 2),
      };
    },
    [],
  );

  const clampOffsets = useCallback(
    (nextX: number, nextY: number, targetImage = image, targetZoom = zoom) => {
      if (!targetImage) {
        return { x: 0, y: 0 };
      }

      const { maxX, maxY } = getBounds(targetImage, targetZoom);
      return {
        x: clamp(nextX, -maxX, maxX),
        y: clamp(nextY, -maxY, maxY),
      };
    },
    [getBounds, image, zoom],
  );

  const drawCanvas = useCallback(() => {
    if (!isOpen || !image || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const baseScale = Math.max(width / image.width, height / image.height);
    const scale = baseScale * zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = (width - drawWidth) / 2 + offsetX;
    const drawY = (height - drawHeight) / 2 + offsetY;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }, [image, isOpen, offsetX, offsetY, zoom]);

  useEffect(() => {
    if (!isOpen) {
      setSource(null);
      setImage(null);
      resetState();
      return;
    }

    if (initialImage) {
      loadImage(initialImage);
    }
  }, [initialImage, isOpen, loadImage, resetState]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    if (!image) {
      return;
    }
    const clamped = clampOffsets(offsetX, offsetY, image, zoom);
    if (clamped.x !== offsetX) {
      setOffsetX(clamped.x);
    }
    if (clamped.y !== offsetY) {
      setOffsetY(clamped.y);
    }
  }, [clampOffsets, image, offsetX, offsetY, zoom]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Выберите изображение");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Не удалось загрузить файл");
        return;
      }
      loadImage(result);
    };
    reader.onerror = () => setError("Не удалось загрузить файл");
    reader.readAsDataURL(file);

    // Allow selecting the same file again.
    event.target.value = "";
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!source || !image) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || !image || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const clamped = clampOffsets(
      drag.startOffsetX + deltaX,
      drag.startOffsetY + deltaY,
    );

    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!image) {
      return;
    }

    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    setZoom((previous) => clamp(previous + delta, MIN_ZOOM, MAX_ZOOM));
  };

  const handleApply = () => {
    if (!source || !canvasRef.current) {
      setError("Сначала выберите фото");
      return;
    }

    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);
    onApply(dataUrl);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={scss.overlay} onClick={onClose}>
      <div className={scss.modal} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={scss.close} onClick={onClose} aria-label="Закрыть">
          <FiX />
        </button>

        <h2>Загрузить фото</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={scss.hiddenInput}
          onChange={handleFilePick}
        />

        <button type="button" className={scss.uploadButton} onClick={openFileDialog}>
          <FiUpload />
          {source ? "Загрузить другое фото" : "Загрузить фото"}
        </button>

        <div
          className={`${scss.preview} ${source ? scss.previewActive : ""} ${isDragging ? scss.dragging : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {!source && (
            <div className={scss.placeholder}>
              <FiUpload />
              <p>Нажмите кнопку выше и выберите изображение</p>
            </div>
          )}

          {source && <canvas ref={canvasRef} />}
        </div>

        {source && (
          <div className={scss.controls}>
            <label>
              Масштаб
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(event) =>
                  setZoom(clamp(Number(event.target.value), MIN_ZOOM, MAX_ZOOM))
                }
              />
            </label>
            <p className={scss.dragHint}>Перемещайте область кадра мышкой или пальцем</p>
          </div>
        )}

        {error && <p className={scss.error}>{error}</p>}

        <button type="button" className={scss.submit} onClick={handleApply}>
          Применить
        </button>
      </div>
    </div>
  );
};

export default AvatarCropModal;
