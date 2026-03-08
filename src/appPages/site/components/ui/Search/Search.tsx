import Image from "next/image";
import scss from "./Search.module.scss";
import search from "@/assets/icons/Search.svg";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useGetAllClothesQuery } from "../../../../../redux/api/category";
import { usePathname, useRouter } from "next/navigation";

const SEARCH_PLACEHOLDER = `${String.fromCharCode(1055, 1086, 1080, 1089, 1082)}...`;

const Search = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const { data = [] } = useGetAllClothesQuery(undefined, { skip: !hasQuery });

  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return data.filter((item) =>
      (item.clothes_name ?? "").toLowerCase().includes(normalizedQuery),
    );
  }, [data, hasQuery, normalizedQuery]);

  const shouldShowResults = isOpen && hasQuery && filteredData.length > 0;

  const handleProductClick = (id: number) => {
    router.push(`/${id}/`);
    setQuery("");
    if (!isMobileView) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setQuery("");
        if (!isMobileView) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileView]);

  useEffect(() => {
    setQuery("");
  }, [pathname]);

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

    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setQuery("");
      }
      return next;
    });
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <div ref={searchRef} className={`${scss.Search} ${isOpen ? scss.open : ""}`}>
      <form
        className={`${scss.SearchForm} ${isOpen ? scss.active : ""}`}
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder={SEARCH_PLACEHOLDER}
          autoComplete="off"
          className={isOpen ? scss.inputVisible : ""}
        />
        <button className={scss.SearchBtn} type="button" onClick={toggleSearch}>
          <Image src={search} alt="Search" />
        </button>
      </form>

      {shouldShowResults && (
        <div className={`${scss.SearchResults} ${scss.resultsVisible}`}>
          {filteredData.map((item) => (
            <div
              key={item.id}
              className={scss.SearchItem}
              onClick={() => handleProductClick(item.id)}
            >
              {Array.isArray(item.clothes_img) && item.clothes_img.length > 0 && (
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
      )}
    </div>
  );
};

export default Search;
