"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiHeart, FiSearch, FiShuffle, FiSliders } from "react-icons/fi";
import {
  useDeleteFavoriteMutation,
  useGetAllCategoryQuery,
  useGetCatalogFeedQuery,
  useGetToFavoriteQuery,
  usePostToFavoriteMutation,
} from "../../../../redux/api/category";
import { useGetMeQuery } from "../../../../redux/api/auth";
import { getStoredAccessToken } from "../../../../utils/authStorage";
import { queueFavoriteIntent } from "../../../../utils/authIntent";
import scss from "./CatalogReaLab.module.scss";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";
import { useEquipmentCompare } from "@/utils/useEquipmentCompare";

type CatalogMode = "catalog" | "new" | "popular" | "sale";

const MODE_CONFIG: Record<
  CatalogMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    section?: "new" | "popular" | "sale";
  }
> = {
  catalog: {
    eyebrow: "ReaLab Catalog",
    title: "Каталог оборудования",
    description:
      "Медицинские системы, сгруппированные по клиническим сценариям, конфигурациям и типам внедрения.",
  },
  popular: {
    eyebrow: "Clinical Pick",
    title: "Клинический выбор",
    description:
      "Наиболее востребованные позиции ReaLab для клиник, лабораторий, функциональной диагностики и реабилитации.",
    section: "popular",
  },
  new: {
    eyebrow: "New Systems",
    title: "Новые решения",
    description:
      "Свежие линейки и обновленные конфигурации оборудования, добавленные в storefront ReaLab.",
    section: "new",
  },
  sale: {
    eyebrow: "Special Terms",
    title: "Спецусловия",
    description:
      "Позиции и комплекты, которые лучше всего подходят для коммерческого предложения, тендера и проектного оснащения.",
    section: "sale",
  },
};

const sortOptions = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating_desc", label: "По рейтингу" },
] as const;

const colorOptions = [
  "Arctic White",
  "Graphite",
  "Pacific Blue",
  "Silver Mist",
  "Coral Signal",
] as const;

const sizeOptions = [
  "Compact",
  "Advanced",
  "ICU",
  "Base",
  "Cart Set",
  "Single Channel",
  "Dual Channel",
  "Transport",
  "Adult",
] as const;

const PAGE_SIZE = 9;

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} KGS`;

const buildCompareItemFromCatalog = (item: AllClothes) => {
  const stockQuantity = Number(
    (item as AllClothes & { quantities?: number | string }).quantities || 0,
  );

  return {
    id: item.id,
    href: buildProductHref(item),
    name: item.clothes_name,
    categoryName: item.category_name || "Каталог",
    imageUrl: item.clothes_img?.[0]?.photo || "",
    price: Number(item.price || 0),
    discountPrice: Number(item.discount_price || 0),
    defaultSize: item.size?.[0] || "Base",
    defaultColorId: item.clothes_img?.[0]?.id ?? null,
    defaultColorLabel: item.clothes_img?.[0]?.color || "Стандартный финиш",
    availabilityLabel: stockQuantity > 0 ? `В наличии ${stockQuantity} шт.` : "Под заказ",
  };
};

const isDiscounted = (item: AllClothes) =>
  Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price);

const getProductBadge = (item: AllClothes) => {
  const normalizedPromos = (item.promo_category || []).map((promo) =>
    (promo.promo_category || "").toLowerCase(),
  );

  if (
    normalizedPromos.some(
      (value) =>
        value.includes("спец") ||
        value.includes("sale") ||
        value.includes("offer") ||
        value.includes("special"),
    )
  ) {
    return "Спецусловие";
  }

  if (normalizedPromos.some((value) => value.includes("нов") || value.includes("new"))) {
    return "Новинка";
  }

  if (
    normalizedPromos.some(
      (value) =>
        value.includes("клин") || value.includes("featured") || value.includes("popular"),
    )
  ) {
    return "Выбор";
  }

  return null;
};

const normalizeSortValue = (value: string | null): string =>
  value && sortOptions.some((item) => item.value === value) ? value : "newest";

const CatalogReaLabPage = ({ mode = "catalog" }: { mode?: CatalogMode }) => {
  const config = MODE_CONFIG[mode];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAccessToken = Boolean(getStoredAccessToken());

  const { data: categoryData = [] } = useGetAllCategoryQuery();
  const { data: me, refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: !hasAccessToken,
  });
  const { data: favoriteItems } = useGetToFavoriteQuery(undefined, {
    skip: !hasAccessToken,
    refetchOnMountOrArgChange: true,
  });
  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();

  const [search, setSearch] = useState(searchParams.get("search")?.trim() || "");
  const [category, setCategory] = useState(searchParams.get("category")?.trim() || "");
  const [color, setColor] = useState(searchParams.get("color")?.trim() || "");
  const [size, setSize] = useState(searchParams.get("size")?.trim() || "");
  const [sort, setSort] = useState(normalizeSortValue(searchParams.get("sort")));
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page") || "1") || 1));
  const [compareNotice, setCompareNotice] = useState("");
  const { compareIds, toggleItem: toggleCompareItem, count: compareCount } = useEquipmentCompare();

  useEffect(() => {
    setSearch(searchParams.get("search")?.trim() || "");
    setCategory(searchParams.get("category")?.trim() || "");
    setColor(searchParams.get("color")?.trim() || "");
    setSize(searchParams.get("size")?.trim() || "");
    setSort(normalizeSortValue(searchParams.get("sort")));
    setPage(Math.max(1, Number(searchParams.get("page") || "1") || 1));
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (search) params.set("search", search);
      else params.delete("search");

      if (category) params.set("category", category);
      else params.delete("category");

      if (color) params.set("color", color);
      else params.delete("color");

      if (size) params.set("size", size);
      else params.delete("size");

      if (sort && sort !== "newest") params.set("sort", sort);
      else params.delete("sort");

      if (page > 1) params.set("page", String(page));
      else params.delete("page");

      const next = params.toString();
      const current = searchParams.toString();
      if (next !== current) {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [search, category, color, size, sort, page, pathname, router, searchParams]);

  const query = useMemo(() => {
    const params: ICATEGORY.getCatalogFeedReq = {
      with_meta: true,
      page,
      page_size: PAGE_SIZE,
      sort: sort as (typeof sortOptions)[number]["value"],
    };

    if (config.section) params.section = config.section;
    if (search) params.search = search;
    if (category) params.category = category;
    if (color) params.color = color;
    if (size) params.size = size;

    return params;
  }, [category, color, config.section, page, search, size, sort]);

  const { data: catalogFeed, isFetching } = useGetCatalogFeedQuery(query);
  const items = catalogFeed?.items ?? [];
  const totalItems = catalogFeed?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentUserId = me?.[0]?.id;
  const activeFiltersCount = [search, category, color, size, sort !== "newest" ? sort : ""].filter(
    Boolean,
  ).length;
  const heroStats = [
    { label: "Фильтров", value: String(activeFiltersCount).padStart(2, "0") },
    { label: "Категорий", value: String(categoryData.length).padStart(2, "0") },
    { label: "Позиции", value: String(totalItems).padStart(2, "0") },
  ];

  const handleFavoriteClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    item: AllClothes,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const safePathname = pathname || "/catalog";

    if (!getStoredAccessToken()) {
      const hrefWithIntent = queueFavoriteIntent({
        returnTo: safePathname,
        clothes_id: item.id,
        clothes: {
          promo_category: item.promo_category,
          clothes_name: item.clothes_name,
          price: item.price,
          size: item.size?.[0] || "",
        },
      });
      router.push(hrefWithIntent);
      return;
    }

    const isFavorite = favoriteItems?.some((fav) => fav.clothes.id === item.id);
    let resolvedUserId = currentUserId;

    if (!resolvedUserId) {
      const meResult = await refetchMe();
      resolvedUserId = meResult.data?.[0]?.id;
    }

    if (!resolvedUserId) {
      return;
    }

    try {
      if (isFavorite) {
        const favoriteItem = favoriteItems?.find((fav) => fav.clothes.id === item.id);
        if (favoriteItem) {
          await deleteFavorite(favoriteItem.id).unwrap();
        }
      } else {
        await postToFavorite({
          clothes: {
            promo_category: item.promo_category,
            clothes_name: item.clothes_name,
            price: item.price,
            size: item.size?.[0] || "",
          },
          clothes_id: item.id,
          favorite_user: resolvedUserId,
        }).unwrap();
      }
    } catch (error) {
      console.error("Favorite toggle failed:", error);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setColor("");
    setSize("");
    setSort("newest");
    setPage(1);
  };

  const handleCompareClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    item: AllClothes,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const nextState = toggleCompareItem(buildCompareItemFromCatalog(item));

    if (nextState === "full") {
      setCompareNotice("В сравнении уже 4 позиции. Откройте compare layer, чтобы освободить слот.");
      return;
    }

    setCompareNotice(
      nextState === "added"
        ? `Позиция «${item.clothes_name}» добавлена в сравнение.`
        : `Позиция «${item.clothes_name}» удалена из сравнения.`,
    );
  };

  return (
    <section className={scss.page}>
      <div className="container">
        <div className={scss.hero}>
          <div className={scss.heroMain}>
            <span>{config.eyebrow}</span>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
            <div className={scss.heroStats}>
              {heroStats.map((item) => (
                <article key={item.label} className={scss.heroStat}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>
          <Link href="/contacts" className={scss.procurementCard}>
            <small>Procurement Desk</small>
            <strong>Нужна комплектация под отделение или проект?</strong>
            <span>
              Соберем КП, подберем конфигурацию поставки и поможем перевести выбор
              оборудования в реальный сценарий внедрения.
            </span>
            <div className={scss.procurementMeta}>
              <span>Ответ от ReaLab team</span>
              <FiArrowRight />
            </div>
          </Link>
        </div>

        <div className={scss.toolbar}>
          <label className={scss.searchField}>
            <FiSearch />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Поиск по названию, категории, сценарию или финишу корпуса"
            />
          </label>

          <div className={scss.filters}>
            <label className={scss.selectField}>
              <span>Категория</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Все</option>
                {categoryData.map((item) => (
                  <option key={item.category_name} value={item.category_name}>
                    {item.category_name}
                  </option>
                ))}
              </select>
            </label>

            <label className={scss.selectField}>
              <span>Конфигурация</span>
              <select
                value={size}
                onChange={(event) => {
                  setSize(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Все</option>
                {sizeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className={scss.selectField}>
              <span>Сортировка</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as (typeof sortOptions)[number]["value"]);
                  setPage(1);
                }}
              >
                {sortOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={scss.colorRow}>
          <div className={scss.colorLabel}>
            <FiSliders />
            <span>Финиш корпуса</span>
          </div>
          <div className={scss.colorChips}>
            <button
              type="button"
              className={!color ? scss.activeChip : ""}
              onClick={() => {
                setColor("");
                setPage(1);
              }}
            >
              Все
            </button>
            {colorOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={color === item ? scss.activeChip : ""}
                onClick={() => {
                  setColor(color === item ? "" : item);
                  setPage(1);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={scss.metaRow}>
          <div className={scss.metaCopy}>
            <p>{isFetching ? "Подбираем оборудование..." : `Найдено позиций: ${totalItems}`}</p>
            <strong>Активных фильтров: {activeFiltersCount}</strong>
            {compareNotice ? <small>{compareNotice}</small> : <small>В сравнении: {compareCount}</small>}
          </div>
          <div className={scss.metaActions}>
            <Link href="/compare" className={scss.compareLink}>
              Сравнение ({compareCount})
            </Link>
            <button type="button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        </div>

        {items.length === 0 && !isFetching ? (
          <div className={scss.emptyState}>
            <h2>Под выбранные параметры пока ничего не найдено</h2>
            <p>
              Измените фильтры или очистите поиск, чтобы увидеть полную матрицу
              медицинского оборудования ReaLab.
            </p>
          </div>
        ) : (
          <div className={scss.grid}>
            {items.map((item) => {
              const image = item.clothes_img?.[0]?.photo || "";
              const isFavorite = favoriteItems?.some((fav) => fav.clothes.id === item.id);
              const badge = getProductBadge(item);
              const effectivePrice = isDiscounted(item) ? item.discount_price : item.price;
              const stockQuantity = Number(
                (item as AllClothes & { quantities?: number | string }).quantities || 0,
              );
              const availabilityLabel =
                stockQuantity > 0 ? `В наличии ${stockQuantity} шт.` : "Под заказ";

              return (
                <Link key={item.id} href={buildProductHref(item)} className={scss.card}>
                  <div className={scss.cardVisual}>
                    {badge ? <span className={scss.badge}>{badge}</span> : null}
                    <div className={scss.cardActionRail}>
                      <button
                        type="button"
                        className={scss.compareButton}
                        onClick={(event) => handleCompareClick(event, item)}
                        aria-label={
                          compareIds.has(item.id)
                            ? "Убрать из сравнения"
                            : "Добавить в сравнение"
                        }
                      >
                        <FiShuffle />
                      </button>
                      <button
                        type="button"
                        className={scss.favoriteButton}
                        onClick={(event) => void handleFavoriteClick(event, item)}
                        aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                      >
                        <FiHeart fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                    {image ? (
                      <Image
                        src={resolveMediaUrl(image)}
                        alt={item.clothes_name}
                        width={720}
                        height={540}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                    ) : (
                      <div className={scss.placeholder} />
                    )}
                  </div>

                  <div className={scss.cardInfo}>
                    <span>{item.category_name}</span>
                    <h3>{item.clothes_name}</h3>
                    <p>{item.size?.slice(0, 2).join(" / ") || "Конфигурация уточняется"}</p>
                    <div className={scss.priceRow}>
                      <strong>{formatPrice(Number(effectivePrice))}</strong>
                      {isDiscounted(item) ? <small>{formatPrice(Number(item.price))}</small> : null}
                    </div>
                    <div className={scss.cardFooter}>
                      <small>{availabilityLabel}</small>
                      <span>{compareIds.has(item.id) ? "В сравнении" : badge || "Clinical view"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className={scss.pagination}>
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Назад
            </button>
            <div className={scss.pageNumbers}>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(Math.max(0, page - 3), Math.max(5, page + 2))
                .map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? scss.activePage : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
            </div>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Далее
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CatalogReaLabPage;
