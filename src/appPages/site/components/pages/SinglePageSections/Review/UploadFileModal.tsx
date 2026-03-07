"use client";

import { useEffect, useRef, useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import scss from "./UploadFileModal.module.scss";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

const UploadFileModal = ({ isOpen, onClose, onApply }: UploadFileModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setImage(null);
      setImageElement(null);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !imageElement || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
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

    const baseScale = Math.max(width / imageElement.width, height / imageElement.height);
    const finalScale = baseScale * zoom;
    const drawWidth = imageElement.width * finalScale;
    const drawHeight = imageElement.height * finalScale;
    const drawX = (width - drawWidth) / 2 + offsetX;
    const drawY = (height - drawHeight) / 2 + offsetY;

    context.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);
  }, [imageElement, isOpen, offsetX, offsetY, zoom]);

  const readFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Выберите изображение");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Не удалось загрузить файл");
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        setImage({
          dataUrl: result,
          width: img.width,
          height: img.height,
        });
        setImageElement(img);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
        setError("");
      };
      img.onerror = () => setError("Не удалось прочитать изображение");
      img.src = result;
    };
    reader.onerror = () => setError("Не удалось прочитать файл");
    reader.readAsDataURL(file);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    readFile(file);
  };

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleApply = () => {
    if (!image || !previewCanvasRef.current) {
      setError("Сначала выберите изображение");
      return;
    }

    const dataUrl = previewCanvasRef.current.toDataURL("image/jpeg", 0.92);
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

        <h2>Загрузить</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={scss.hiddenInput}
          onChange={onFileChange}
        />

        <button type="button" className={scss.dropZone} onClick={onUploadClick}>
          {!image && (
            <div className={scss.dropContent}>
              <FiUpload />
              <p>Нажмите сюда чтобы загрузить документ</p>
            </div>
          )}

          {image && (
            <div className={scss.previewWrap}>
              <canvas ref={previewCanvasRef} className={scss.previewCanvas} />
            </div>
          )}
        </button>

        {image && (
          <div className={scss.controls}>
            <label>
              Масштаб
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <label>
              Сдвиг X
              <input
                type="range"
                min={-250}
                max={250}
                step={1}
                value={offsetX}
                onChange={(event) => setOffsetX(Number(event.target.value))}
              />
            </label>
            <label>
              Сдвиг Y
              <input
                type="range"
                min={-250}
                max={250}
                step={1}
                value={offsetY}
                onChange={(event) => setOffsetY(Number(event.target.value))}
              />
            </label>
          </div>
        )}

        {error && <p className={scss.error}>{error}</p>}

        <button type="button" className={scss.submit} onClick={handleApply}>
          Загрузить
        </button>
      </div>
    </div>
  );
};

export default UploadFileModal;
