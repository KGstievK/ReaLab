import Image from "next/image";
import scss from "./Search.module.scss";
import search from "@/assets/icons/Search.svg";
import { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useGetAllClothesQuery } from "../../../../../redux/api/category";
import { useRouter } from "next/navigation";

interface SearchForm {
  query: string;
}

const Search = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const { data } = useGetAllClothesQuery();
  const { register, handleSubmit, watch, reset } = useForm<SearchForm>();
  const searchQuery = watch("query", "");
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const onSubmit: SubmitHandler<SearchForm> = (data) => {
    console.log("Search Query:", data.query);
  };

  const filteredData = data?.filter((item) =>
    item.clothes_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleProductClick = (id: number) => {
    router.push(`/${id}/`);
    reset();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        if (isMobileView) {
          return;
        }

        setIsOpen(false);
        reset();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileView, reset]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 750px)");

    const applyMode = (matches: boolean) => {
      setIsMobileView(matches);
      setIsOpen(matches);
    };

    applyMode(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => applyMode(event.matches);
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const toggleSearch = () => {
    if (isMobileView) {
      return;
    }

    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={searchRef}
      className={`${scss.Search} ${isOpen ? scss.open : ""}`}
    >
      <form
        className={`${scss.SearchForm} ${isOpen ? scss.active : ""}`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          type="text"
          {...register("query")}
          placeholder="\u041f\u043e\u0438\u0441\u043a..."
          className={isOpen ? scss.visible : ""}
        />
        <button className={scss.SearchBtn} type="button" onClick={toggleSearch}>
          <Image src={search} alt="Search" />
        </button>
      </form>

      <div
        className={`${scss.SearchResults} ${isOpen && searchQuery ? scss.visible : ""}`}
      >
        {filteredData?.map((item) => (
          <div
            key={item.id}
            className={scss.SearchItem}
            onClick={() => handleProductClick(item.id)}
          >
            {item.clothes_img.length > 0 && (
              <Image
                src={item.clothes_img[0].photo}
                alt="product"
                width={100}
                height={100}
              />
            )}
            <div className={scss.infoSearch}>
              <p>{item.clothes_name}</p>
              <p>${item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;

