import Image from "next/image";
import scss from "./Content.module.scss";
import arrow from "@/assets/icons/arrow.svg";
import { useRouter } from "next/navigation";
import { useGetEndContentQuery } from "../../../../../../redux/api/category";

const Content = () => {
  const router = useRouter();
  const { data } = useGetEndContentQuery();
  console.log("🚀 ~ Content ~ data:", data);

  // Если данных нет, не рендерим компонент
  if (!data || data.length === 0) return null;

  return (
    <section className={scss.Content}>
      <div className={scss.content}>
        {data.map((item, idx) => (
          <div key={idx} className={scss.block}>
            <h1>{item.text}</h1>
            <p>{item.title}</p>
            <button onClick={() => router.push("/about")}>
              Подробнее <Image src={arrow} alt="arrow" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Content;
