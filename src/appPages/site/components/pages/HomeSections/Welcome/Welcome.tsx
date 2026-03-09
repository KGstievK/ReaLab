import React, { useEffect, useState } from "react";
import scss from "./Welcome.module.scss";
import Image from "next/image";
import arrow from "@/assets/icons/arrow.svg";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetFirstSectionQuery } from "../../../../../../redux/api/category";

const Welcome = () => {
  const router = useRouter();
  const { data } = useGetFirstSectionQuery();
  const [imageOrder, setImageOrder] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    if (data?.[0]) {
      setImageOrder([0, 1, 2]);
    }
  }, [data]);

  if (!data?.[0]) return null;

  const images = [
    {
      id: 0,
      image: data[0].clothes1?.clothes_img?.[0]?.photo ?? "",
      link: data[0].clothes1?.id ? `/${data[0].clothes1.id}` : "/",
    },
    {
      id: 1,
      image: data[0].clothes2?.clothes_img?.[0]?.photo ?? "",
      link: data[0].clothes2?.id ? `/${data[0].clothes2.id}` : "/",
    },
    {
      id: 2,
      image: data[0].clothes3?.clothes_img?.[0]?.photo ?? "",
      link: data[0].clothes3?.id ? `/${data[0].clothes3.id}` : "/",
    },
  ];

  const hasRequiredImages = images.every((item) => Boolean(item.image));

  if (!hasRequiredImages) return null;

  const activeImageIndex = imageOrder[0];
  const activeImage = images[activeImageIndex];
  const previewImageIndexes = imageOrder.slice(1);

  const handlePreviewImageClick = (orderIndex: number) => {
    setImageOrder((previousOrder) => {
      const nextOrder = [...previousOrder];
      [nextOrder[0], nextOrder[orderIndex]] = [
        nextOrder[orderIndex],
        nextOrder[0],
      ];
      return nextOrder;
    });
  };

  const handleMainImageClick = () => {
    router.push(activeImage.link || "/");
  };

  return (
    <section className={scss.Welcome}>
      <div className="container">
        <div className={scss.content}>
          <div className={scss.Swiper}>
            <div className={scss.SwiperSlide}>
              <div className={scss.Swiper_Title}>
                <h4>{data[0].made}</h4>
                <h1>{data[0].title}</h1>
                <button onClick={() => router.push("/catalog")}>
                  Каталог
                  <Image src={arrow} alt="Valid src"  loading="eager"/>
                </button>
              </div>
              <div className={scss.Swiper_Image}>
                <div className={scss.Swiper_Image_tab}>
                  <Image
                    className={scss.image_wrapper}
                    src={activeImage.image}
                    alt="tab"
                    width={420}
                    height={630}
                    style={{ cursor: "pointer" }}
                    onClick={handleMainImageClick}
                    loading="eager"
                  />
                  <Link href={activeImage.link || "/"}>
                    Купить <Image src={arrow} alt="Valid src" />
                  </Link>
                </div>
                {previewImageIndexes.map((visibleIndex, previewPosition) => (
                  <Image
                    key={images[visibleIndex].id}
                    src={images[visibleIndex].image}
                    alt={`Slide ${visibleIndex}`}
                    width={156}
                    height={234}
                    style={{ cursor: "pointer" }}
                    onClick={() => handlePreviewImageClick(previewPosition + 1)}
                    loading="eager"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
