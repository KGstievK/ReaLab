"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import arrow from "@/assets/icons/arrow.svg";
import dressImage from "@/assets/images/Catalog1.png";
import hijabImage from "@/assets/images/Catalog2.png";
import tunicImage from "@/assets/images/Catalog3.png";
import scss from "./Catalog.module.scss";

const Catalog = () => {
  const router = useRouter();

  return (
    <section className={scss.catalog}>
      <div className="container">
        <div className={scss.headerRow}>
          <h2>Каталог</h2>
          <button onClick={() => router.push("/catalog")} type="button" className={scss.desktopButton}>
            Каталог <Image src={arrow} alt="arrow" />
          </button>
        </div>

        <div className={scss.grid}>
          <div className={scss.leftColumn}>
            <button
              type="button"
              className={`${scss.tile} ${scss.dress}`}
              onClick={() => router.push("/catalog")}
            >
              <Image src={dressImage} alt="Платья" fill className={scss.tileImage} />
              <span>ПЛАТЬЯ</span>
            </button>

            <button
              type="button"
              className={`${scss.tile} ${scss.hijab}`}
              onClick={() => router.push("/catalog")}
            >
              <Image src={hijabImage} alt="Хиджабы" fill className={scss.tileImage} />
              <span>ХИДЖАБЫ</span>
            </button>
          </div>

          <button
            type="button"
            className={`${scss.tile} ${scss.tunic}`}
            onClick={() => router.push("/catalog")}
          >
            <Image src={tunicImage} alt="Туники" fill className={scss.tileImage} />
            <span>ТУНИКИ</span>
          </button>
        </div>

        <Link href="/catalog" className={scss.mobileButton}>
          Каталог <Image src={arrow} alt="arrow" />
        </Link>
      </div>
    </section>
  );
};

export default Catalog;
