"use client";

import Image from "next/image";
import { FC, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import arrow from "@/assets/icons/Vector (Stroke).svg";
import filterImg from "@/assets/icons/Filter.svg";
import { useGetAllCategoryQuery } from "../../../../../../redux/api/category";
import Cards from "../cards/Cards";
import scss from "./sideBar.module.scss";

type SectionKeys = "type" | "price" | "size" | "color";

const CATEGORY_OPTIONS_FALLBACK = [
  { label: "Платье", count: "0" },
  { label: "Абайка", count: "0" },
  { label: "Юбка", count: "0" },
  { label: "Платок", count: "0" },
];

const SIZE_OPTIONS = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

const COLOR_OPTIONS = ["Чёрный", "Белый", "Айвори", "Зелёный", "Красный", "Коричневый"];

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating_desc", label: "По рейтингу" },
] as const;

type CatalogSortValue = (typeof SORT_OPTIONS)[number]["value"];

const normalizeSortValue = (value: string | null | undefined): CatalogSortValue =>
  SORT_OPTIONS.some((item) => item.value === value) ? (value as CatalogSortValue) : "newest";

const readCatalogFilters = (searchParams: ReturnType<typeof useSearchParams>) => ({
  category: searchParams.get("category")?.trim() || "",
  size: searchParams.get("size")?.trim() || "",
  color: searchParams.get("color")?.trim() || "",
  min: searchParams.get("min_price")?.trim() || "",
  max: searchParams.get("max_price")?.trim() || "",
  sort: normalizeSortValue(searchParams.get("sort")?.trim()),
  page: Math.max(1, Number(searchParams.get("page") || "1") || 1),
});

const SideBar: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: categoryData } = useGetAllCategoryQuery();

  const filtersFromUrl = useMemo(() => readCatalogFilters(searchParams), [searchParams]);

  const [category, setCategory] = useState(filtersFromUrl.category);
  const [selectedSize, setSelectedSize] = useState<string>(filtersFromUrl.size);
  const [selectedColor, setSelectedColor] = useState<string>(filtersFromUrl.color);
  const [sort, setSort] = useState<CatalogSortValue>(filtersFromUrl.sort);
  const [page, setPage] = useState(filtersFromUrl.page);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: filtersFromUrl.min,
    max: filtersFromUrl.max,
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionKeys, boolean>>({
    type: true,
    price: true,
    size: true,
    color: true,
  });

  const categoryOptions = useMemo(() => {
    if (!categoryData || categoryData.length === 0) {
      return CATEGORY_OPTIONS_FALLBACK;
    }

    return categoryData.map((item) => ({
      label: item.category_name,
      count: String(item.count ?? item.clothes_category?.length ?? 0),
    }));
  }, [categoryData]);

  useEffect(() => {
    if (!category) {
      return;
    }

    const hasCurrentCategory = categoryOptions.some((item) => item.label === category);
    if (!hasCurrentCategory) {
      setCategory("");
    }
  }, [category, categoryOptions]);

  useEffect(() => {
    setCategory((prev) => (prev === filtersFromUrl.category ? prev : filtersFromUrl.category));
    setSelectedSize((prev) => (prev === filtersFromUrl.size ? prev : filtersFromUrl.size));
    setSelectedColor((prev) => (prev === filtersFromUrl.color ? prev : filtersFromUrl.color));
    setSort((prev) => (prev === filtersFromUrl.sort ? prev : filtersFromUrl.sort));
    setPage((prev) => (prev === filtersFromUrl.page ? prev : filtersFromUrl.page));
    setPriceRange((prev) => {
      if (prev.min === filtersFromUrl.min && prev.max === filtersFromUrl.max) {
        return prev;
      }

      return {
        min: filtersFromUrl.min,
        max: filtersFromUrl.max,
      };
    });
  }, [filtersFromUrl]);

  const maxSliderValue = 20000;

  useEffect(() => {
    if (!isMobileFilterOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileFilterOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileFilterOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1025px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        setIsMobileFilterOpen(false);
      }
    };

    handleChange(mediaQuery);
    const listener = (event: MediaQueryListEvent) => handleChange(event);
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (category) {
        nextParams.set("category", category);
      } else {
        nextParams.delete("category");
      }

      if (selectedSize) {
        nextParams.set("size", selectedSize);
      } else {
        nextParams.delete("size");
      }

      if (selectedColor) {
        nextParams.set("color", selectedColor);
      } else {
        nextParams.delete("color");
      }

      if (priceRange.min) {
        nextParams.set("min_price", priceRange.min);
      } else {
        nextParams.delete("min_price");
      }

      if (priceRange.max) {
        nextParams.set("max_price", priceRange.max);
      } else {
        nextParams.delete("max_price");
      }

      if (sort !== "newest") {
        nextParams.set("sort", sort);
      } else {
        nextParams.delete("sort");
      }

      if (page > 1) {
        nextParams.set("page", String(page));
      } else {
        nextParams.delete("page");
      }

      const currentQuery = searchParams.toString();
      const nextQuery = nextParams.toString();
      if (currentQuery === nextQuery) {
        return;
      }

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [category, selectedColor, selectedSize, priceRange.min, priceRange.max, sort, page, pathname, router, searchParams]);

  const toggleSection = (section: SectionKeys) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (value: string) => {
    setPage(1);
    setCategory((prev) => (prev === value ? "" : value));
  };

  const handleSizeChange = (size: string) => {
    setPage(1);
    setSelectedSize((prev) => (prev === size ? "" : size));
  };

  const handleColorChange = (color: string) => {
    setPage(1);
    setSelectedColor((prev) => (prev === color ? "" : color));
  };

  const handlePriceInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "min" | "max",
  ) => {
    const rawValue = event.target.value.replace(/\D/g, "");

    if (!rawValue) {
      setPage(1);
      setPriceRange((prev) => ({
        ...prev,
        [type]: "",
      }));
      return;
    }

    const numericValue = Number(rawValue);
    setPage(1);

    setPriceRange((prev) => {
      const currentMin = Number(prev.min);
      const currentMax = Number(prev.max);

      if (type === "min") {
        const effectiveMax = Number.isFinite(currentMax) && currentMax > 0 ? currentMax : maxSliderValue;
        const normalizedMin = Math.min(Math.max(numericValue, 0), effectiveMax);
        return { ...prev, min: String(normalizedMin) };
      }

      const effectiveMin = Number.isFinite(currentMin) && currentMin > 0 ? currentMin : 0;
      const normalizedMax = Math.max(Math.min(numericValue, maxSliderValue), effectiveMin);
      return { ...prev, max: String(normalizedMax) };
    });
  };

  const clearFilters = () => {
    setCategory("");
    setSelectedSize("");
    setSelectedColor("");
    setPriceRange({ min: "", max: "" });
    setPage(1);
  };

  const minSliderValue = useMemo(() => {
    const parsedMin = Number(priceRange.min);
    if (Number.isFinite(parsedMin) && parsedMin > 0) {
      return Math.min(parsedMin, maxSliderValue);
    }
    return 0;
  }, [priceRange.min]);

  const maxPriceValue = useMemo(() => {
    const parsedMax = Number(priceRange.max);
    if (Number.isFinite(parsedMax) && parsedMax > 0) {
      return Math.min(Math.max(parsedMax, minSliderValue), maxSliderValue);
    }
    return maxSliderValue;
  }, [minSliderValue, priceRange.max]);

  const rangeFillStyle = useMemo(() => {
    const minPercent = (minSliderValue / maxSliderValue) * 100;
    const maxPercent = (maxPriceValue / maxSliderValue) * 100;
    return {
      left: `${minPercent}%`,
      width: `${Math.max(maxPercent - minPercent, 0)}%`,
    };
  }, [maxPriceValue, minSliderValue]);

  const handleMinRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextMin = Math.min(Number(event.target.value), maxPriceValue);
    setPage(1);
    setPriceRange((prev) => ({
      ...prev,
      min: String(nextMin),
    }));
  };

  const handleMaxRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextMax = Math.max(Number(event.target.value), minSliderValue);
    setPage(1);
    setPriceRange((prev) => ({
      ...prev,
      max: String(nextMax),
    }));
  };

  const handleSortChange = (nextSort: string) => {
    const normalizedSort = normalizeSortValue(nextSort);
    setPage(1);
    setSort(normalizedSort);
  };

  const renderFilterBody = () => (
    <>
      <div className={scss.filterSection}>
        <button type="button" className={scss.filterHeader} onClick={() => toggleSection("type")}>
          <h4>ВИД</h4>
          <Image src={arrow} alt="toggle" />
        </button>
        {openSections.type && (
          <div className={scss.filterContent}>
            {categoryOptions.map((item) => (
              <label key={item.label} className={scss.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={category === item.label}
                  onChange={() => handleCategoryChange(item.label)}
                />
                <span className={scss.customCheckbox} />
                <span className={scss.optionLabel}>{item.label}</span>
                <span className={scss.optionCount}>{item.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={scss.filterSection}>
        <button type="button" className={scss.filterHeader} onClick={() => toggleSection("price")}>
          <h4>ЦЕНА</h4>
          <Image src={arrow} alt="toggle" />
        </button>
        {openSections.price && (
          <div className={scss.filterContent}>
            <div className={scss.priceInputs}>
              <input
                type="text"
                placeholder="min."
                value={priceRange.min}
                onChange={(event) => handlePriceInputChange(event, "min")}
              />
              <input
                type="text"
                placeholder="max."
                value={priceRange.max}
                onChange={(event) => handlePriceInputChange(event, "max")}
              />
            </div>
            <div className={scss.rangeSliderWrap}>
              <div className={scss.rangeTrackArea}>
                <div className={scss.rangeTrack} />
                <div className={scss.rangeFill} style={rangeFillStyle} />
              </div>
              <input
                type="range"
                min={0}
                max={maxSliderValue}
                value={minSliderValue}
                onChange={handleMinRangeChange}
                className={`${scss.priceRangeSlider} ${scss.minRangeSlider}`}
              />
              <input
                type="range"
                min={0}
                max={maxSliderValue}
                value={maxPriceValue}
                onChange={handleMaxRangeChange}
                className={`${scss.priceRangeSlider} ${scss.maxRangeSlider}`}
              />
            </div>
          </div>
        )}
      </div>

      <div className={scss.filterSection}>
        <button type="button" className={scss.filterHeader} onClick={() => toggleSection("size")}>
          <h4>РАЗМЕР</h4>
          <Image src={arrow} alt="toggle" />
        </button>
        {openSections.size && (
          <div className={scss.filterContent}>
            {SIZE_OPTIONS.map((sizeItem) => (
              <label key={sizeItem} className={scss.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={selectedSize === sizeItem}
                  onChange={() => handleSizeChange(sizeItem)}
                />
                <span className={scss.customCheckbox} />
                <span className={scss.optionLabel}>{sizeItem}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={scss.colorShortcut}>
        <span>ЦВЕТ</span>
        <span>›</span>
      </div>

      <div className={scss.filterSection}>
        <button type="button" className={scss.filterHeader} onClick={() => toggleSection("color")}>
          <h4>ЦВЕТ</h4>
          <Image src={arrow} alt="toggle" />
        </button>
        {openSections.color && (
          <div className={scss.filterContent}>
            {COLOR_OPTIONS.map((colorItem) => (
              <label key={colorItem} className={scss.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={selectedColor === colorItem}
                  onChange={() => handleColorChange(colorItem)}
                />
                <span className={scss.customCheckbox} />
                <span className={scss.optionLabel}>{colorItem}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={scss.clearFilter}>
        <button type="button" onClick={clearFilters}>
          Очистить ×
        </button>
      </div>
    </>
  );

  return (
    <section className={scss.filter}>
      <div className={scss.blockFilter}>
        <button
          type="button"
          className={scss.mobileFilterButton}
          onClick={() => setIsMobileFilterOpen(true)}
          aria-label="Открыть фильтры"
          aria-expanded={isMobileFilterOpen}
          aria-controls="catalog-mobile-filter"
        >
          <Image src={filterImg} alt="filter" width={18} height={18} />
          <h4>ФИЛЬТР</h4>
        </button>

        <div className={scss.desktopFilter}>
          <div className={scss.filterContainer}>{renderFilterBody()}</div>
        </div>
      </div>

      <Cards
        value={category}
        size={selectedSize}
        color={selectedColor}
        sort={sort}
        page={page}
        onPageChange={setPage}
        onSortChange={handleSortChange}
        priceRange={[
          parseInt(priceRange.min, 10) || 0,
          parseInt(priceRange.max, 10) || Number.MAX_SAFE_INTEGER,
        ]}
      />

      <div
        className={`${scss.mobileOverlay} ${isMobileFilterOpen ? scss.mobileOverlayOpen : ""}`}
        onClick={() => setIsMobileFilterOpen(false)}
      >
        <div
          id="catalog-mobile-filter"
          className={`${scss.mobileSheet} ${isMobileFilterOpen ? scss.mobileSheetOpen : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={scss.mobileSheetTop}>
            <div className={scss.mobileSheetTitle}>
              <Image src={filterImg} alt="filter" width={18} height={18} />
              <h4>ФИЛЬТР</h4>
            </div>
            <button
              type="button"
              className={scss.mobileClose}
              onClick={() => setIsMobileFilterOpen(false)}
              aria-label="Закрыть фильтры"
            >
              ×
            </button>
          </div>

          <div className={`${scss.filterContainer} ${scss.mobileFilterContainer}`}>
            {renderFilterBody()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SideBar;
