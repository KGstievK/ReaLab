import React, { FC, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import {
  useDeleteFavoriteMutation,
  useGetCatalogFeedQuery,
  useGetToFavoriteQuery,
  usePostToFavoriteMutation,
} from "../../../../../../redux/api/category";
import { useGetMeQuery } from "../../../../../../redux/api/auth";
import { getStoredAccessToken } from "../../../../../../utils/authStorage";
import { buildSignInHref, queueFavoriteIntent } from "../../../../../../utils/authIntent";
import heart from "@/assets/icons/HeartStraight.svg";
import heartRed from "@/assets/icons/red-heart-icon.svg";
import star from "@/assets/images/star.png";
import ColorsClothes from "../../../ui/colors/Colors";
import scss from "./cards.module.scss";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";

interface ClothesCategoryItem {
  id: number;
  promo_category: Array<{
    promo_category: string;
  }>;
  clothes_name: string;
  clothes_id?: number;
  price: number;
  discount_price: number;
  size: Array<string>;
  average_rating: number;
  created_date: string;
  clothes_img: Array<{
    id?: number;
    photo: string;
    color: string;
  }>;
  category_name: string;
}

const CATALOG_PAGE_SIZE = 9;
const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating_desc", label: "По рейтингу" },
] as const;

type CatalogSortValue = (typeof SORT_OPTIONS)[number]["value"];

const Cards: FC<{
  value: string;
  size: string;
  color: string;
  priceRange: [number, number];
  sort: CatalogSortValue;
  page: number;
  onPageChange: (page: number) => void;
  onSortChange: (sort: CatalogSortValue) => void;
}> = ({ value, size, color, priceRange, sort, page, onPageChange, onSortChange }) => {
  const router = useRouter();
  const pathname = usePathname();

  const minPrice = Number.isFinite(priceRange[0]) ? priceRange[0] : 0;
  const maxPrice = Number.isFinite(priceRange[1]) ? priceRange[1] : Number.MAX_SAFE_INTEGER;

  const clothesQuery = useMemo(() => {
    const query: ICATEGORY.getCatalogFeedReq = {
      with_meta: true,
      page,
      page_size: CATALOG_PAGE_SIZE,
      sort,
    };

    if (value.trim()) {
      query.category = value.trim();
    }

    if (size.trim()) {
      query.size = size.trim();
    }

    if (color.trim()) {
      query.color = color.trim();
    }

    if (minPrice > 0) {
      query.min_price = minPrice;
    }

    if (maxPrice < Number.MAX_SAFE_INTEGER) {
      query.max_price = maxPrice;
    }

    return query;
  }, [color, maxPrice, minPrice, page, size, sort, value]);

  const { data: catalogFeed, isFetching } = useGetCatalogFeedQuery(clothesQuery);
  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();
  const { data: me, refetch: refetchMe } = useGetMeQuery();
  const currentUserId = me?.[0]?.id;
  const filteredItems = catalogFeed?.items ?? [];
  const totalItems = catalogFeed?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / CATALOG_PAGE_SIZE));

  const visiblePages = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, Math.max(start + 4, Math.min(totalPages, 5)));
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [page, totalPages]);

  const hasAccessToken = Boolean(getStoredAccessToken());
  const { data: favoriteItems } = useGetToFavoriteQuery(undefined, {
    skip: !hasAccessToken,
    refetchOnMountOrArgChange: true,
  });

  const handleFavoriteClick = async (
    event: React.MouseEvent,
    item: ClothesCategoryItem,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const safePathname = pathname || "/catalog";
    const signInHref = buildSignInHref(safePathname, safePathname);

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
      router.push(signInHref);
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

  return (
    <div id={scss.Cards}>
      <div className={scss.content}>
        <div className={scss.toolbar}>
          <p className={scss.resultsCount}>
            {isFetching ? "Обновляем каталог..." : `Найдено товаров: ${totalItems}`}
          </p>

          <label className={scss.sortControl}>
            <span>Сортировка</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as CatalogSortValue)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!isFetching && filteredItems.length === 0 ? (
          <div className={scss.emptyState}>
            <h3>По выбранным параметрам ничего не найдено</h3>
            <p>Измените фильтры или сбросьте часть ограничений.</p>
          </div>
        ) : (
          <div className={scss.cards}>
            {filteredItems.map((item) => (
              <div key={item.id} className={scss.card}>
                <div className={scss.blockImg}>
                  <div className={scss.like}>
                    <div className={scss.star}>
                      <Image width={500} height={300} alt="photo" src={star} />
                      <h6>{item.average_rating}</h6>
                    </div>
                    <button
                      type="button"
                      className={scss.heart}
                      onClick={(event) => {
                        void handleFavoriteClick(event, item);
                      }}
                    >
                      <Image
                        width={24}
                        height={24}
                        src={favoriteItems?.some((fav) => fav.clothes.id === item.id) ? heartRed : heart}
                        alt="heart"
                      />
                    </button>
                  </div>

                  {item.clothes_img.slice(0, 1).map((image, index) => (
                    <Link href={buildProductHref(item)} key={`${item.id}-${index}`}>
                      <Image
                        width={5000}
                        height={3000}
                        src={resolveMediaUrl(image.photo) as string | StaticImport}
                        alt="photo"
                        className={scss.mainImg}
                      />
                    </Link>
                  ))}
                </div>

                <div className={scss.blockText}>
                  <div className={scss.productCategory}>
                    <h4>{item.category_name}</h4>
                    <div className={scss.colors}>
                      <ColorsClothes clothesImg={item.clothes_img.slice(0, 3)} />
                    </div>
                  </div>
                  <h2>{item.clothes_name}</h2>
                  <div className={scss.price}>
                    <span>{Math.round(item.discount_price).toString()} сом</span>
                    <del>{Math.round(item.price)} сом</del>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className={scss.pagination}>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Назад
            </button>

            <div className={scss.pageNumbers}>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={page === pageNumber ? scss.pageActive : ""}
                  onClick={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Далее
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cards;
