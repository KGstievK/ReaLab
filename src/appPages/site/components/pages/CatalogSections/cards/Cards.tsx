import React, { FC, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import {
  useDeleteFavoriteMutation,
  useGetAllClothesQuery,
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

const Cards: FC<{
  value: string;
  size: string;
  color: string;
  priceRange: [number, number];
}> = ({ value, size, color, priceRange }) => {
  const router = useRouter();
  const pathname = usePathname();

  const minPrice = Number.isFinite(priceRange[0]) ? priceRange[0] : 0;
  const maxPrice = Number.isFinite(priceRange[1]) ? priceRange[1] : Number.MAX_SAFE_INTEGER;

  const clothesQuery = useMemo(() => {
    const query: Exclude<ICATEGORY.getAllClothesReq, void> = {};

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
  }, [color, maxPrice, minPrice, size, value]);

  const { data: filteredItems = [] } = useGetAllClothesQuery(clothesQuery);
  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();
  const { data: me, refetch: refetchMe } = useGetMeQuery();
  const currentUserId = me?.[0]?.id;

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
                      src={resolveMediaUrl(image.photo) as string | StaticImport}
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

