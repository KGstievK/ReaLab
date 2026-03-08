"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import arrow from "@/assets/icons/arrow.svg";
import { useGetEndContentQuery } from "../../../../../../redux/api/category";
import scss from "./Content.module.scss";

const DEFAULT_TEXT =
  "Мы создаём одежду, которая объединяет традиции и современный стиль. В каждой детали — качество, комфорт и забота о вас. Наши коллекции вдохновляют и подчёркивают вашу индивидуальность.";
const DEFAULT_SIGNATURE = "С любовью, Jumana";

const Content = () => {
  const router = useRouter();
  const { data } = useGetEndContentQuery();
  const block = data?.[0];

  const text = block?.text || DEFAULT_TEXT;
  const signature = block?.title || DEFAULT_SIGNATURE;

  return (
    <section className={scss.contentSection}>
      <div className={scss.inner}>
        <p className={scss.text}>{text}</p>
        <p className={scss.signature}>{signature}</p>

        <button type="button" onClick={() => router.push("/about")}>
          Подробнее <Image src={arrow} alt="arrow" />
        </button>
      </div>
    </section>
  );
};

export default Content;
