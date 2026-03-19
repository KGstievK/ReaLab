import { useEffect, useState } from "react";
import scss from "./Welcome.module.scss";
import Image from "next/image";
import arrow from "@/assets/icons/arrow.svg";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetFirstSectionQuery } from "../../../../../../redux/api/category";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";

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
      image: resolveMediaUrl(data[0].clothes1?.clothes_img?.[0]?.photo ?? ""),
      link: data[0].clothes1?.id ? buildProductHref(data[0].clothes1) : "/",
    },
    {
      id: 1,
      image: resolveMediaUrl(data[0].clothes2?.clothes_img?.[0]?.photo ?? ""),
      link: data[0].clothes2?.id ? buildProductHref(data[0].clothes2) : "/",
    },
    {
      id: 2,
      image: resolveMediaUrl(data[0].clothes3?.clothes_img?.[0]?.photo ?? ""),
      link: data[0].clothes3?.id ? buildProductHref(data[0].clothes3) : "/",
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
        <div className={scss.hero}>
          <div className={scss.copy}>
            <span className={scss.eyebrow}>{data[0].made}</span>
            <h1>{data[0].title}</h1>
            <p>
              ReaLab собирает каталог медицинских систем в светлой клинической
              эстетике: без перегруза, с быстрым выбором конфигураций, поставки и
              сервисного маршрута.
            </p>

            <div className={scss.actions}>
              <button
                type="button"
                className={scss.primaryButton}
                onClick={() => router.push("/catalog")}
              >
                Перейти в каталог
                <Image src={arrow} alt="Стрелка" loading="eager" />
              </button>

              <Link href="/about" className={scss.secondaryLink}>
                О ReaLab
              </Link>
            </div>
          </div>

          <div className={scss.gallery}>
            <div className={scss.mainCard}>
              <Image
                className={scss.mainImage}
                src={activeImage.image}
                alt="Решение ReaLab"
                width={420}
                height={630}
                onClick={handleMainImageClick}
                priority
                sizes="(max-width: 900px) 100vw, 42vw"
              />
              <Link href={activeImage.link || "/"} className={scss.buyLink}>
                Смотреть решение
                <Image src={arrow} alt="Стрелка" />
              </Link>
            </div>

            <div className={scss.previewColumn}>
              {previewImageIndexes.map((visibleIndex, previewPosition) => (
                <button
                  key={images[visibleIndex].id}
                  type="button"
                  className={scss.previewButton}
                  onClick={() => handlePreviewImageClick(previewPosition + 1)}
                >
                  <Image
                    className={scss.previewImage}
                    src={images[visibleIndex].image}
                    alt={`Коллекция ${visibleIndex + 1}`}
                    width={156}
                    height={234}
                    sizes="(max-width: 900px) 26vw, 13vw"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
