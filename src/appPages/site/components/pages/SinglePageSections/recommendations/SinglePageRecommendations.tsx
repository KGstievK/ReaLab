"use client";

import { FC, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import scss from "./SinglePageRecommendations.module.scss";
import star from "@/assets/icons/Star.svg";
import heart from "@/assets/icons/HeartStraight.svg";
import heartRed from "@/assets/icons/red-heart-icon.svg";
import bagSvg from "@/assets/icons/bag-happy.svg";
import ColorsClothes from "../../../ui/colors/Colors";
import {
  useDeleteFavoriteMutation,
  useGetAllClothesQuery,
  useGetToFavoriteQuery,
  usePostToFavoriteMutation,
} from "../../../../../../redux/api/category";
import { useGetMeQuery } from "../../../../../../redux/api/auth";

interface PromoCategoryItem {
  promo_category: string;
}

interface RecommendationProps {
  currentProductId: number;
  currentPromoCategory: PromoCategoryItem[];
  currentColors: string[];
}

interface ClothesItem {
  id: number;
  promo_category: PromoCategoryItem[];
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

const SinglePageRecommendations: FC<RecommendationProps> = ({
  currentProductId,
  currentPromoCategory,
  currentColors,
}) => {
  const router = useRouter();
  const { data: allClothes = [] } = useGetAllClothesQuery();
  const { data: favoriteItems } = useGetToFavoriteQuery();
  const { data: me } = useGetMeQuery();
  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();
  const [isMobile, setIsMobile] = useState(false);

  const currentUserId = me?.[0]?.id;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 750px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);

  const favoriteIds = useMemo(() => {
    return new Set((favoriteItems ?? []).map((item) => item.clothes.id));
  }, [favoriteItems]);

  const recommendations = useMemo(() => {
    if (!allClothes.length) {
      return [];
    }

    const userFavorites = allClothes.filter((item) => favoriteIds.has(item.id));

    const likedPromo = new Set<string>();
    const likedColors = new Set<string>();

    if (userFavorites.length) {
      userFavorites.forEach((item) => {
        item.promo_category.forEach((promo) => {
          likedPromo.add((promo.promo_category || "").toLowerCase());
        });

        item.clothes_img.forEach((photo) => {
          likedColors.add((photo.color || "").toLowerCase());
        });
      });
    } else {
      currentPromoCategory.forEach((promo) => {
        likedPromo.add((promo.promo_category || "").toLowerCase());
      });
      currentColors.forEach((color) =>
        likedColors.add((color || "").toLowerCase()),
      );
    }

    return allClothes
      .filter((item) => item.id !== currentProductId)
      .map((item) => {
        let score = 0;

        if (
          item.promo_category.some((promo) =>
            likedPromo.has((promo.promo_category || "").toLowerCase()),
          )
        ) {
          score += 4;
        }

        if (
          item.clothes_img.some((photo) =>
            likedColors.has((photo.color || "").toLowerCase()),
          )
        ) {
          score += 3;
        }

        if (favoriteIds.has(item.id)) {
          score += 2;
        }

        score += (item.average_rating || 0) / 10;

        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [
    allClothes,
    currentColors,
    currentProductId,
    currentPromoCategory,
    favoriteIds,
  ]);

  const cards = recommendations.slice(0, isMobile ? 8 : 4);

  const handleFavoriteClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    item: ClothesItem,
  ) => {
    event.stopPropagation();

    const isFavorite = favoriteItems?.some((fav) => fav.clothes.id === item.id);

    try {
      if (isFavorite) {
        const favoriteItem = favoriteItems?.find(
          (fav) => fav.clothes.id === item.id,
        );
        if (favoriteItem) {
          await deleteFavorite(favoriteItem.id).unwrap();
        }
      } else {
        if (!currentUserId) {
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

  if (!cards.length) {
    return null;
  }

  return (
    <section className={scss.recommendations}>
      <div className={scss.header}>
        <h2>Рекомендуемые товары</h2>
      </div>

      <div className={scss.cards}>
        {cards.map((item) => (
          <article
            key={item.id}
            className={scss.card}
            onClick={() => router.push(`/${item.id}`)}
          >
            <div className={scss.cardImage}>
              <div className={scss.cardTop}>
                <div className={scss.rating}>
                  <Image src={star} alt="star" width={14} height={14} />
                  <span>{(item.average_rating || 4.95).toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  className={scss.favoriteButton}
                  onClick={(event) => void handleFavoriteClick(event, item)}
                >
                  <Image
                    src={
                      favoriteItems?.some((fav) => fav.clothes.id === item.id)
                        ? heartRed
                        : heart
                    }
                    alt="favorite"
                    width={20}
                    height={20}
                  />
                </button>
              </div>

              {item.clothes_img[0] && (
                <Image
                  src={item.clothes_img[0].photo}
                  alt={item.clothes_name}
                  width={420}
                  height={540}
                  className={scss.mainImage}
                />
              )}

              <button type="button" className={scss.cartButton}>
                <Image src={bagSvg} alt="cart" width={20} height={20} />
              </button>
            </div>

            <div className={scss.cardInfo}>
              <div className={scss.metaRow}>
                <p>PRODUCT CATEGORY</p>
                <ColorsClothes clothesImg={item.clothes_img.slice(0, 3)} size="sm" />
              </div>

              <h3>{item.clothes_name}</h3>

              <div className={scss.price}>
                <span>{Math.round(item.discount_price)}сом</span>
                <del>{Math.round(item.price)}сом</del>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SinglePageRecommendations;

