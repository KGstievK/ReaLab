"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import scss from "./AboutRecommendations.module.scss";
import arrow from "@/assets/icons/arrow.svg";
import star from "@/assets/icons/Star.svg";
import heart from "@/assets/icons/HeartStraight.svg";
import heartRed from "@/assets/icons/red-heart-icon.svg";
import bagIcon from "@/assets/icons/bag-happyBlack.svg";
import ColorsClothes from "../../../ui/colors/Colors";
import {
  useDeleteFavoriteMutation,
  useGetAllClothesQuery,
  useGetToFavoriteQuery,
  usePostToFavoriteMutation,
} from "../../../../../../redux/api/category";
import { useGetMeQuery } from "../../../../../../redux/api/auth";
import { queueFavoriteIntent } from "../../../../../../utils/authIntent";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";

interface ClothesItem {
  id: number;
  category_name: string;
  promo_category: Array<{
    promo_category: string;
  }>;
  clothes_name: string;
  price: number;
  discount_price: number;
  size: string[];
  average_rating: number;
  clothes_img: Array<{
    photo: string;
    color: string;
  }>;
}

const isDiscounted = (item: ClothesItem) =>
  Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price);

const formatPrice = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} KGS`;

const AboutRecommendations = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: clothes = [] } = useGetAllClothesQuery({ limit: 48 });
  const { data: me } = useGetMeQuery();
  const { data: favoriteItems } = useGetToFavoriteQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();
  const [isMobile, setIsMobile] = useState(false);

  const currentUserId = me?.[0]?.id;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 750px)");
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const favoriteIds = useMemo(() => {
    return new Set((favoriteItems ?? []).map((item) => item.clothes.id));
  }, [favoriteItems]);

  const recommendations = useMemo(() => {
    if (!clothes.length) {
      return [];
    }

    const favorites = clothes.filter((item) => favoriteIds.has(item.id));
    const likedPromo = new Set<string>();
    const likedColors = new Set<string>();

    favorites.forEach((item) => {
      item.promo_category.forEach((promo) => {
        likedPromo.add((promo.promo_category || "").toLowerCase());
      });

      item.clothes_img.forEach((photo) => {
        likedColors.add((photo.color || "").toLowerCase());
      });
    });

    const scored = clothes
      .filter((item) => !favoriteIds.has(item.id))
      .map((item) => {
        let score = 0;

        if (!likedPromo.size && !likedColors.size) {
          score += item.average_rating || 0;
        } else {
          if (
            item.promo_category.some((promo) =>
              likedPromo.has((promo.promo_category || "").toLowerCase()),
            )
          ) {
            score += 3;
          }

          if (
            item.clothes_img.some((photo) =>
              likedColors.has((photo.color || "").toLowerCase()),
            )
          ) {
            score += 2;
          }

          score += (item.average_rating || 0) / 10;
        }

        return { item, score };
      })
      .sort(
        (a, b) =>
          b.score - a.score || b.item.average_rating - a.item.average_rating,
      )
      .map(({ item }) => item);

    const fallback = clothes
      .filter((item) => !favoriteIds.has(item.id))
      .sort((a, b) => b.average_rating - a.average_rating);

    const merged: ClothesItem[] = [];
    const usedIds = new Set<number>();

    [...scored, ...fallback].forEach((item) => {
      if (!usedIds.has(item.id)) {
        usedIds.add(item.id);
        merged.push(item);
      }
    });

    return merged;
  }, [clothes, favoriteIds]);

  const visibleRecommendations = recommendations.slice(0, isMobile ? 8 : 4);

  const handleFavoriteClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    item: ClothesItem,
  ) => {
    event.stopPropagation();

    const isFavorite = favoriteItems?.some((fav) => fav.clothes.id === item.id);

    try {
      if (isFavorite) {
        const favoriteItem = favoriteItems?.find((fav) => fav.clothes.id === item.id);
        if (favoriteItem) {
          await deleteFavorite(favoriteItem.id).unwrap();
        }
      } else {
        if (!currentUserId) {
          const safePathname = pathname || "/about";
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

        await postToFavorite({
          clothes: {
            promo_category: item.promo_category,
            clothes_name: item.clothes_name,
            price: item.price,
            size: item.size?.[0] || "",
          },
          clothes_id: item.id,
          favorite_user: currentUserId,
        }).unwrap();
      }
    } catch (error) {
      console.error("Favorite toggle failed:", error);
    }
  };

  if (!visibleRecommendations.length) {
    return null;
  }

  return (
    <section className={scss.recommendations}>
      <div className="container">
        <div className={scss.header}>
          <div className={scss.headerCopy}>
            <span className={scss.eyebrow}>Подборка ReaLab</span>
            <h2>Рекомендуемые решения</h2>
            <p>
              Позиции, которые продолжают логику каталога ReaLab: клинические
              сценарии, понятные конфигурации и спокойная технологичная подача.
            </p>
          </div>

          <Link href="/catalog" className={scss.desktopAction}>
            Перейти в каталог <Image src={arrow} alt="Стрелка" />
          </Link>
        </div>

        <div className={scss.cards}>
          {visibleRecommendations.map((item) => {
            const hasDiscount = isDiscounted(item);
            const isFavorite = favoriteItems?.some((fav) => fav.clothes.id === item.id);
            const productHref = buildProductHref(item);

            return (
              <article key={item.id} className={scss.card}>
                <div className={scss.imageWrap}>
                  <div className={scss.cardTop}>
                    <div className={scss.rating}>
                      <Image src={star} alt="Рейтинг" width={14} height={14} />
                      <span>{(item.average_rating || 4.95).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      className={scss.favoriteButton}
                      onClick={(event) => void handleFavoriteClick(event, item)}
                      aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                    >
                      <Image
                        src={isFavorite ? heartRed : heart}
                        alt="Избранное"
                        width={22}
                        height={22}
                      />
                    </button>
                  </div>

                  <Link href={productHref} className={scss.imageLink} aria-label={`Открыть товар ${item.clothes_name}`}>
                    {item.clothes_img[0] ? (
                      <Image
                        src={resolveMediaUrl(item.clothes_img[0].photo)}
                        alt={item.clothes_name}
                        width={450}
                        height={560}
                        className={scss.mainImage}
                      />
                    ) : (
                      <div className={scss.imageFallback}>Скоро появится фото</div>
                    )}
                  </Link>

                  <button
                    type="button"
                    className={scss.cartButton}
                    onClick={() => router.push(productHref)}
                    aria-label={`Открыть товар ${item.clothes_name}`}
                  >
                    <Image src={bagIcon} alt="Открыть товар" width={18} height={18} />
                  </button>
                </div>

                <div className={scss.cardInfo}>
                  <div className={scss.cardMeta}>
                    <p>{item.category_name}</p>
                    {item.clothes_img.length > 0 && (
                      <ColorsClothes clothesImg={item.clothes_img.slice(0, 4)} size="sm" />
                    )}
                  </div>

                  <Link href={productHref} className={scss.titleLink}>
                    <h3>{item.clothes_name}</h3>
                  </Link>

                  <div className={scss.priceBlock}>
                    <span>{formatPrice(hasDiscount ? item.discount_price : item.price)}</span>
                    {hasDiscount && <del>{formatPrice(item.price)}</del>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Link href="/catalog" className={scss.mobileAction}>
          Перейти в каталог <Image src={arrow} alt="Стрелка" />
        </Link>
      </div>
    </section>
  );
};

export default AboutRecommendations;
