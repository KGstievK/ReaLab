"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { useGetMeQuery } from "../../../../../../redux/api/auth";
import {
  useDeleteFavoriteMutation,
  useGetAllClothesQuery,
  useGetToFavoriteQuery,
  usePostToFavoriteMutation,
} from "../../../../../../redux/api/category";
import { queueFavoriteIntent } from "../../../../../../utils/authIntent";
import bagIcon from "@/assets/icons/bag-happyBlack.svg";
import arrow from "@/assets/icons/arrow.svg";
import heart from "@/assets/icons/HeartStraight.svg";
import heartRed from "@/assets/icons/red-heart-icon.svg";
import star from "@/assets/icons/Star.svg";
import scss from "./Popular.module.scss";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";

interface ClothesItem {
  id: number;
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

const formatPrice = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} KGS`;

const Popular = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: popularItems = [] } = useGetAllClothesQuery({ section: "popular", limit: 4 });
  const { data: me } = useGetMeQuery();
  const currentUserId = me?.[0]?.id;

  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();
  const { data: favoriteItems } = useGetToFavoriteQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const handleFavoriteClick = async (
    event: React.MouseEvent,
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
          const safePathname = pathname || "/";
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
            size: item.size[0],
          },
          clothes_id: item.id,
          favorite_user: currentUserId,
        }).unwrap();
      }
    } catch (error) {
      console.error("Favorite toggle failed:", error);
    }
  };

  if (popularItems.length === 0) {
    return null;
  }

  return (
    <section className={scss.Popular}>
      <div className="container">
        <div className={scss.headerRow}>
          <h2>Популярные товары</h2>
          <button onClick={() => router.push("/catalog")} type="button" className={scss.desktopMore}>
            Посмотреть все <Image src={arrow} alt="arrow" />
          </button>
        </div>

        <ul className={scss.tags}>
          <li>ICU</li>
          <li>ультразвук</li>
          <li>инфузия</li>
        </ul>

        <div className={scss.cards}>
          {popularItems.map((item) => (
            <article
              key={item.id}
              className={scss.card}
              onClick={() => router.push(buildProductHref(item))}
            >
              <div className={scss.blockImg}>
                <div className={scss.like}>
                  <div className={scss.star}>
                    <Image src={star} alt="rating" />
                    <span>{item.average_rating}</span>
                  </div>

                  <button
                    type="button"
                    className={scss.heart}
                    onClick={(event) => {
                      void handleFavoriteClick(event, item as ClothesItem);
                    }}
                  >
                    <Image
                      width={20}
                      height={20}
                      src={favoriteItems?.some((fav) => fav.clothes.id === item.id) ? heartRed : heart}
                      alt="favorite"
                    />
                  </button>
                </div>

                {item.clothes_img.slice(0, 1).map((image, index) => (
                  <Image
                    key={index}
                    width={1200}
                    height={1600}
                    src={resolveMediaUrl(image.photo) as string | StaticImport}
                    alt={item.clothes_name}
                    className={scss.mainImg}
                  />
                ))}

                <button
                  type="button"
                  className={scss.cartBtn}
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(buildProductHref(item));
                  }}
                >
                  <Image src={bagIcon} alt="go" />
                </button>
              </div>

              <div className={scss.blockText}>
                <div className={scss.productCategory}>
                  <h4>{item.category_name}</h4>
                  <div className={scss.colors}>
                    {/* <ColorsClothes clothesImg={item.clothes_img.slice(0, 3)} /> */}
                  </div>
                </div>

                <h3>{item.clothes_name}</h3>

                <div className={scss.price}>
                  <span>{formatPrice(item.discount_price)}</span>
                  <del>{formatPrice(item.price)}</del>
                </div>
              </div>
            </article>
          ))}
        </div>

        <Link href="/popular" className={scss.mobileMore}>
          Посмотреть все <Image src={arrow} alt="arrow" />
        </Link>
      </div>
    </section>
  );
};

export default Popular;
