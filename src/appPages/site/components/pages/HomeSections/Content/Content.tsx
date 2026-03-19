"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import arrow from "@/assets/icons/arrow.svg";
import { useGetEndContentQuery } from "../../../../../../redux/api/category";
import scss from "./Content.module.scss";

const DEFAULT_TEXT =
  "ReaLab выстраивает поставку медицинского оборудования как цельный продуктовый опыт: от понятного каталога и подбора конфигурации до запуска, сопровождения и повторных закупок.";
const DEFAULT_SIGNATURE = "Команда ReaLab";

const Content = () => {
  const router = useRouter();
  const { data } = useGetEndContentQuery();
  const block = data?.[0];

  const text = block?.text || DEFAULT_TEXT;
  const signature = block?.title || DEFAULT_SIGNATURE;

  return (
    <section className={scss.contentSection}>
      <div className="container">
        <div className={scss.inner}>
          <span className={scss.eyebrow}>Подход ReaLab</span>
          <p className={scss.text}>{text}</p>
          <p className={scss.signature}>{signature}</p>

          <button type="button" onClick={() => router.push("/about")}>
            История ReaLab <Image src={arrow} alt="Стрелка" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Content;
