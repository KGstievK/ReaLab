"use client";

import { FC, useEffect, useState } from "react";
import s from "./colors.module.scss";

interface IClothesImg {
  id?: number | null;
  photo: string;
  color: string;
}

interface IPropsColors {
  clothesImg: IClothesImg[];
  onClick?: (item: IClothesImg) => void;
  size?: "sm" | "md";
}

const colorMap: Record<string, string> = {
  серый: "#808080",
  коричневый: "#7b4f33",
  синий: "#2e5aac",
  зеленый: "#2f8d4e",
  красный: "#d84a4a",
  желтый: "#e6bf3f",
  оранжевый: "#df8f3a",
  черный: "#1f1f1f",
  белый: "#ffffff",
  фиолетовый: "#7f63c6",
  розовый: "#d885a8",
  голубой: "#7ab5d8",
  бирюзовый: "#52b7b4",
  бежевый: "#cbb497",
  золотой: "#b89b39",
  серебряный: "#b9b9b9",
  бордовый: "#6e1f33",
  gray: "#808080",
  brown: "#7b4f33",
  blue: "#2e5aac",
  green: "#2f8d4e",
  red: "#d84a4a",
  yellow: "#e6bf3f",
  orange: "#df8f3a",
  black: "#1f1f1f",
  white: "#ffffff",
  purple: "#7f63c6",
  pink: "#d885a8",
  lightblue: "#7ab5d8",
  turquoise: "#52b7b4",
  beige: "#cbb497",
  gold: "#b89b39",
  silver: "#b9b9b9",
  maroon: "#6e1f33",
  graphite: "#6e717b",
  "arctic white": "#f3f6fb",
  "pacific blue": "#6f9cbe",
  "silver mist": "#c5ccd6",
  "coral signal": "#ff8f8b",
};

const getColor = (color: string): string => {
  const normalized = color.trim().toLowerCase();

  if (normalized.startsWith("#") || normalized.startsWith("rgb")) {
    return normalized;
  }

  return colorMap[normalized] || "#d9d9d9";
};

const ColorsClothes: FC<IPropsColors> = ({
  clothesImg,
  onClick,
  size = "md",
}) => {
  const [selectedColorId, setSelectedColorId] = useState<number | string | null>(
    null,
  );

  useEffect(() => {
    if (!clothesImg.length || !onClick) {
      return;
    }

    const first = clothesImg[0];
    const firstId = first.id ?? `${first.color}-${first.photo}`;
    setSelectedColorId(firstId);
  }, [clothesImg, onClick]);

  const handleColorClick = (item: IClothesImg) => {
    const currentId = item.id ?? `${item.color}-${item.photo}`;
    setSelectedColorId(currentId);
    onClick?.(item);
  };

  return (
    <div className={`${s.container} ${size === "sm" ? s.sm : s.md}`}>
      {clothesImg.map((item, index) => {
        const colorId = item.id ?? `${item.color}-${item.photo}-${index}`;

        return (
          <button
            key={colorId}
            type="button"
            className={`${s.circle} ${selectedColorId === colorId ? s.selected : ""}`}
            style={{ backgroundColor: getColor(item.color) }}
            title={item.color}
            onClick={() => handleColorClick(item)}
            aria-label={`Цвет ${item.color}`}
          />
        );
      })}
    </div>
  );
};

export default ColorsClothes;
