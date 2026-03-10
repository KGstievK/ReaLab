"use client";

import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, usePathname, useRouter } from "next/navigation";
import star from "@/assets/images/star.png";
import bagSvg from "@/assets/icons/bag-happy.svg";
import scss from "./SinglePageSection.module.scss";
import {
  useAddToBasketMutation,
  useGetCartQuery,
  useUpdateBasketMutation,
} from "../../../../../redux/api/product";
import { useGetClothesByIdQuery } from "../../../../../redux/api/category";
import { getStoredAccessToken } from "../../../../../utils/authStorage";
import { buildSignInHref } from "../../../../../utils/authIntent";
import ColorsClothes from "../../ui/colors/Colors";
import Sizes from "./sizes/Sizes";
import Review from "./Review/Review";
import SinglePageRecommendations from "./recommendations/SinglePageRecommendations";

const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

interface ClothesImg {
  photo: string;
  id: number;
  color: string;
}

interface CartItem {
  id: number;
  clothes_id: number;
  size: string;
  color: number;
  quantity: number;
}

interface CartData {
  cart_items: CartItem[];
}

interface FormValues {
  color_id: number;
  size: string;
}

const SinglePageSection: FC = () => {
  const id = useParams();
  const { data: cart } = useGetCartQuery();
  const { data } = useGetClothesByIdQuery(Number(id.single));
  const [selectedPhoto, setSelectedPhoto] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [count, setCounter] = useState(1);
  const [addBasketMutation] = useAddToBasketMutation();
  const [updateBasketMutation] = useUpdateBasketMutation();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedCart: CartData | undefined = Array.isArray(cart)
    ? cart[0]
    : (cart as CartData | undefined);

  const {
    handleSubmit,
    formState: { errors },
    setValue: setFormValue,
    register,
  } = useForm<FormValues>({
    defaultValues: {
      color_id: 0,
      size: "",
    },
  });

  useEffect(() => {
    if (data?.clothes_img?.length) {
      const firstPhoto = data.clothes_img[0];
      setSelectedPhoto(firstPhoto.photo);
      setFormValue("color_id", firstPhoto.id, { shouldValidate: true });
    }
  }, [data, setFormValue]);

  if (!data) {
    return <div>Загрузка данных...</div>;
  }

  const incrementCount = () => {
    setCounter((prevCount) =>
      prevCount < data.quantities ? prevCount + 1 : prevCount,
    );
  };

  const decrementCount = () => {
    setCounter((prevCount) => (prevCount > 1 ? prevCount - 1 : prevCount));
  };

  const onSubmit = async (formData: FormValues) => {
    if (!formData.color_id || !formData.size) {
      return;
    }

    if (!getStoredAccessToken()) {
      const safePath = pathname && pathname.startsWith("/") ? pathname : `/${id.single}`;
      router.push(buildSignInHref(safePath, safePath));
      return;
    }

    try {
      const cartItems = normalizedCart?.cart_items || [];
      const sameItem = cartItems.find(
        (item) =>
          item.clothes_id === data.id &&
          item.color === formData.color_id &&
          item.size === formData.size,
      );

      if (sameItem) {
        await updateBasketMutation({
          id: sameItem.id,
          updateBasket: {
            quantity: sameItem.quantity + count,
          },
        }).unwrap();
      } else {
        await addBasketMutation({
          clothes_id: data.id,
          color_id: formData.color_id,
          size: formData.size,
          quantity: count,
          clothes: {
            clothes_name: "",
          },
          color: {
            color: "",
          },
        }).unwrap();
      }

      router.push("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const {
    clothes_name,
    clothes_description,
    price,
    discount_price,
    size: availableSizes,
    textile_clothes,
    clothes_img,
    average_rating,
    id: productId,
  } = data;

  const normalizedAvailableSizes = (
    Array.isArray(availableSizes)
      ? availableSizes
      : (availableSizes?.split(",") ?? [])
  )
    .map((item: string) => item.trim().toUpperCase())
    .filter(Boolean);

  const currentPrice = Math.round(Number(discount_price ?? price));
  const previousPrice = Math.round(Number(price));
  const ratingValue = Number(average_rating || 0).toFixed(2);

  return (
    <section className={scss.SinglePageSection}>
      <div className="container">
        <div className={scss.header}>
          <Link href="/">Главная</Link>
          <span>|</span>
          <Link href="/catalog">Категории</Link>
          <span>|</span>
          <span>Платья</span>
          <span>|</span>
          <Link href={`/${productId}`}>{clothes_name}</Link>
        </div>

        <div className={scss.content}>
          <div className={scss.images}>
            <div className={scss.mainImg}>
              <Image
                src={selectedPhoto || "/fallback-image.png"}
                alt={clothes_name}
                width={6000}
                height={5000}
              />
            </div>

            <div className={scss.thumbnails}>
              {clothes_img?.map((item: ClothesImg) => (
                <div
                  key={item.id}
                  className={`${scss.thumbnail} ${
                    item.photo === selectedPhoto ? scss.activeThumbnail : ""
                  }`}
                  onClick={() => {
                    setFormValue("color_id", item.id, { shouldValidate: true });
                    setSelectedPhoto(item.photo);
                  }}
                >
                  <Image
                    src={item.photo}
                    alt={`Фото ${item.id}`}
                    width={2500}
                    height={2500}
                  />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={scss.info}>
            <input
              type="hidden"
              {...register("color_id", { required: true, valueAsNumber: true })}
            />
            <input type="hidden" {...register("size", { required: true })} />

            <div className={scss.headLine}>
              <h3>PRODUCT CATEGORY</h3>
              <div className={scss.mark}>
                <Image src={star} alt="Рейтинг" width={24} height={24} />
                <h6>{ratingValue}</h6>
              </div>
            </div>

            <h1>{clothes_name}</h1>

            <div className={scss.price}>
              <del>{previousPrice} с</del>
              <h4>{currentPrice} с</h4>
            </div>


            <div className={scss.textile}>
              <h5>Ткань:</h5>
              <h4>
                {textile_clothes
                  .map((item: { textile_name: string }) =>
                    capitalize(item.textile_name),
                  )
                  .join(", ")}
              </h4>
            </div>

            <div className={scss.colors}>
              <h5>Цвета:</h5>
              <ColorsClothes
                clothesImg={clothes_img}
                onClick={(item) => {
                  if (!item.id) {
                    return;
                  }

                  setFormValue("color_id", item.id, { shouldValidate: true });
                  setSelectedPhoto(item.photo);
                }}
              />
              {errors.color_id && (
                <p className={scss.error} role="alert">
                  Пожалуйста, выберите цвет
                </p>
              )}
            </div>
            <div className={scss.description}>
              <p>{clothes_description}</p>
            </div>

            <div className={scss.sizes}>
              <Sizes
                sizes={sizes}
                availableSizes={normalizedAvailableSizes}
                selectedSize={selectedSize}
                onClick={(size) => {
                  setFormValue("size", size, { shouldValidate: true });
                  setSelectedSize(size);
                }}
              />
              {errors.size && (
                <p className={scss.error} role="alert">
                  Пожалуйста, выберите размер
                </p>
              )}
            </div>

            <div className={scss.quantity}>
              <h3>Количество:</h3>
              <div className={scss.groupOfBtn}>
                <div className={scss.counter}>
                  <button
                    type="button"
                    onClick={decrementCount}
                    disabled={count === 1}
                  >
                    -
                  </button>
                  <span>{count}</span>
                  <button
                    type="button"
                    onClick={incrementCount}
                    disabled={count >= data.quantities}
                    className={count >= data.quantities ? scss.disabledBtn : ""}
                  >
                    +
                  </button>
                </div>

                <button type="submit" className={scss.cart}>
                  В корзинку
                  <Image src={bagSvg} alt="Корзина" width={20} height={20} />
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className={scss.recommendations}>
          <SinglePageRecommendations
            currentProductId={data.id}
            currentPromoCategory={data.promo_category}
            currentColors={data.clothes_img.map((item) => item.color)}
          />
        </div>

        <div className={scss.review}>
          <Review />
        </div>
      </div>
    </section>
  );
};

export default SinglePageSection;

