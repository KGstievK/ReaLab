"use client";
import Image from "next/image";
import scss from "./newClothes.module.scss";
import star from "@/assets/images/star.png";
import heart from "@/assets/icons/HeartStraight.svg";
import heartRed from "@/assets/icons/red-heart-icon.svg";
import {
  useDeleteFavoriteMutation,
  useGetAllClothesQuery,
  useGetToFavoriteQuery,
  usePostToFavoriteMutation,
} from "../../../../../../redux/api/category";
import { useGetMeQuery } from "../../../../../../redux/api/auth";
import ColorsClothes from "../../../ui/colors/Colors";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import backIcon from "@/assets/icons/backIcon.svg";
import { queueFavoriteIntent } from "../../../../../../utils/authIntent";
import { resolveMediaUrl } from "@/utils/media";

interface ClothesCategoryItem {
  clothes_category: Array<{
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
  }>;
}

const NewClothesSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useGetMeQuery();
  const currentUserId = me?.[0]?.id;

  const { data: newArrivals } = useGetAllClothesQuery({ section: "new" });

  const [postToFavorite] = usePostToFavoriteMutation();
  const [deleteFavorite] = useDeleteFavoriteMutation();

  const { data: favoriteItems } = useGetToFavoriteQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const handleFavoriteClick = async (
    e: React.MouseEvent,
    item: ClothesCategoryItem["clothes_category"][0],
  ) => {
    e.stopPropagation();

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
          const safePathname = pathname || "/new";
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
      console.error("Favori iЕџlemi baЕџarД±sД±z:", error);
    }
  };

  if (!newArrivals || newArrivals.length === 0) {
    return null;
  }

  return (
    <div id={scss.Cards}>
      <div className="container">
        <div className={scss.header}>
          <Image src={backIcon} alt="icon " width={22} height={22} />
          <Link href="/">Р“Р»Р°РІРЅР°СЏ</Link>/<Link href="/new">РќРѕРІРёРЅРєРё</Link>
        </div>
        <h1 className={scss.title}>РќРѕРІРёРЅРєРё</h1>
        <div className={scss.content}>
          <div className={scss.cards}>
            {newArrivals?.map((item) => (
              <div
                key={item.id}
                className={scss.card}
                onClick={() => router.push(`/${item.id}`)}
              >
                <div className={scss.blockImg}>
                  <div className={scss.like}>
                    <div className={scss.star}>
                      <Image
                        width={500}
                        height={300}
                        layout="intrinsic"
                        alt="photo"
                        src={star}
                      />
                      <h6>{item.average_rating}</h6>
                    </div>
                    <div
                      className={scss.heart}
                      onClick={(e) => {
                        (e.stopPropagation(), handleFavoriteClick(e, item));
                      }}
                    >
                      <Image
                        width={24}
                        height={24}
                        src={
                          favoriteItems?.some(
                            (fav) => fav.clothes.id === item.id,
                          )
                            ? heartRed
                            : heart
                        }
                        alt="heart"
                      />
                    </div>
                  </div>
                  {item.clothes_img.slice(0, 1).map((el, index) => (
                    <Image
                      key={index}
                      width={5000}
                      height={3000}
                      layout="intrinsic"
                      src={resolveMediaUrl(el.photo)}
                      alt="photo"
                      className={scss.mainImg}
                    />
                  ))}
                </div>
                <div className={scss.blockText}>
                  <div className={scss.productCategory}>
                    <h4>Product Category</h4>
                    <div className={scss.colors}>
                      <ColorsClothes
                        clothesImg={item.clothes_img.slice(0, 3)}
                      />
                    </div>
                  </div>
                  <h2>{item.clothes_name}</h2>
                  <div className={scss.price}>
                    <span>
                      {Math.round(item.discount_price).toString()} cРѕРј
                    </span>
                    <del>{Math.round(item.price)} cРѕРј</del>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewClothesSection;


