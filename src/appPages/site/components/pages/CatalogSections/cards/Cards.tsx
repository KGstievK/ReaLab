import React, { FC, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import {
  useDeleteFavoriteMutation,
  useGetAllCategoryQuery,
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
    photo: string;
    color: string;
  }>;
  category_name: string;
}

const normalizeText = (value: string) => value.toLowerCase().trim();

const Cards: FC<{
  value: string;
  size: string;
  color: string;
  priceRange: [number, number];
}> = ({ value, size, color, priceRange }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { data } = useGetAllCategoryQuery();
  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();
  const { data: me, refetch: refetchMe } = useGetMeQuery();
  const currentUserId = me?.[0]?.id;

  const hasAccessToken = Boolean(getStoredAccessToken());
  const { data: favoriteItems } = useGetToFavoriteQuery(undefined, {
    skip: !hasAccessToken,
    refetchOnMountOrArgChange: true,
  });

  const minPrice = Number.isFinite(priceRange[0]) ? priceRange[0] : 0;
  const maxPrice = Number.isFinite(priceRange[1]) ? priceRange[1] : Number.MAX_SAFE_INTEGER;

  const filteredItems = useMemo<ClothesCategoryItem[]>(() => {
    if (!data) {
      return [];
    }

    const normalizedCategory = normalizeText(value || "");
    const normalizedSize = normalizeText(size || "");
    const normalizedColor = normalizeText(color || "");

    return data
      .flatMap((category) =>
        category.clothes_category.map((item) => ({
          ...item,
          category_name: category.category_name,
        })),
      )
      .filter((item) => {
        const matchCategory =
          !normalizedCategory || normalizeText(item.category_name) === normalizedCategory;

        const matchSize =
          !normalizedSize ||
          (Array.isArray(item.size) &&
            item.size.some((sizeValue: string) => normalizeText(sizeValue) === normalizedSize));

        const matchColor =
          !normalizedColor ||
          item.clothes_img.some(
            (colorItem: { color: string }) => normalizeText(colorItem.color) === normalizedColor,
          );

        const price = Number(item.discount_price);
        const matchPrice = Number.isFinite(price) && price >= minPrice && price <= maxPrice;

        return matchCategory && matchSize && matchColor && matchPrice;
      });
  }, [color, data, maxPrice, minPrice, size, value]);

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
                  <Link href={`/${item.id}`} key={`${item.id}-${index}`}>
                    <Image
                      width={5000}
                      height={3000}
                      src={image.photo as string | StaticImport}
                      alt="photo"
                      className={scss.mainImg}
                    />
                  </Link>
                ))}
              </div>

              <div className={scss.blockText}>
                <div className={scss.productCategory}>
                  <h4>Product Category</h4>
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
      </div>
    </div>
  );
};

export default Cards;
