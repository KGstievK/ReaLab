"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import arrow from "@/assets/icons/arrowBlack.svg";
import saleFallback from "@/assets/images/Sale.png";
import { useGetSaleContentQuery } from "../../../../../../redux/api/category";
import scss from "./Sale.module.scss";
// import { resolveMediaUrl } from "@/utils/media";

const DEFAULT_TITLE = "Скидки до 50%!";
const DEFAULT_TEXT =
  "Не упустите шанс! Выберите стильные модели по выгодным ценам. Акция действует ограниченное время.";

const Sale = () => {
  const { data } = useGetSaleContentQuery();
  const saleItem = data?.[0];

  const title = saleItem?.title || DEFAULT_TITLE;
  const text = saleItem?.text || DEFAULT_TEXT;
  // const imageSrc = ((saleItem?.img ? resolveMediaUrl(saleItem.img) : saleFallback) as string | StaticImageData);

  return (
    <section className={scss.sale}>
      <div className={scss.content}>
        <div className={scss.media}>
          <Image
            src={saleFallback}
            alt={title}
            fill
            sizes="(max-width: 750px) 100vw, 50vw"
            className={scss.mediaImage}
          />
        </div>

        <div className={scss.copy}>
          <h2>{title}</h2>
          <p>{text}</p>
          <Link href="/sale" className={scss.moreLink}>
            Подробнее <Image src={arrow} alt="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Sale;
