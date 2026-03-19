import { FC } from "react";
import scss from "./sizes.module.scss";

const Sizes: FC<{
  sizes: string[];
  availableSizes: string[];
  selectedSize: string | null;
  onClick: (size: string) => void;
}> = ({ sizes, availableSizes, selectedSize, onClick }) => (
  <div className={scss.sizes}>
    <h5>Размеры:</h5>

    <div className={scss.spans}>
      {sizes.map((size) => {
        const isAvailable = availableSizes.includes(size);
        const isSelected = selectedSize === size;

        return (
          <button
            key={size}
            type="button"
            className={`${scss.size} ${
              isAvailable ? scss.available : scss.unavailable
            } ${isSelected ? scss.selected : ""}`}
            onClick={() => isAvailable && onClick(size)}
            disabled={!isAvailable}
            aria-pressed={isSelected}
          >
            {size}
          </button>
        );
      })}
    </div>
  </div>
);

export default Sizes;
