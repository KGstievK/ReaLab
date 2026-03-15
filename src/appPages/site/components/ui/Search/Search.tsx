import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import search from "@/assets/icons/Search.svg";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import { useSearchCatalogQuery } from "../../../../../redux/api/search";
import scss from "./Search.module.scss";

const SEARCH_PLACEHOLDER = "Поиск...";
const SEARCH_DEBOUNCE_MS = 250;

type SearchProductLink = {
  id: number;
  clothes_name: string;
};

const Search = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const typedQuery = query.trim();
  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const hasTypedQuery = typedQuery.length > 0;
  const hasQuery = normalizedQuery.length > 0;
  const isDebouncing = typedQuery.toLowerCase() !== normalizedQuery;

  const { data, error, isFetching } = useSearchCatalogQuery(
    hasQuery
      ? {
          q: normalizedQuery,
          limit: 8,
        }
      : undefined,
    { skip: !hasQuery },
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  const productResults = useMemo(() => (hasQuery ? data?.products || [] : []), [data, hasQuery]);
  const categoryResults = data?.categories || [];
  const searchError = hasQuery && error ? extractApiErrorInfo(error, "Не удалось выполнить поиск") : null;
  const searchErrorMessage = searchError
    ? getRateLimitAwareMessage(
        searchError,
        "Слишком много поисковых запросов. Попробуйте позже.",
      )
    : "";
  const shouldShowResults = isOpen && hasTypedQuery;

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [query]);

  const handleProductClick = (product: SearchProductLink) => {
    router.push(buildProductHref(product));
    setQuery("");
    if (!isMobileView) {
      setIsOpen(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/catalog?category=${encodeURIComponent(categoryName)}`);
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
          {(isDebouncing || isFetching) && (
            <div className={scss.SearchState}>Ищем...</div>
          )}

          {!isDebouncing && !isFetching && searchErrorMessage && (
            <div className={`${scss.SearchState} ${scss.SearchStateError}`}>
              {searchErrorMessage}
            </div>
          )}

          {!isDebouncing && !isFetching && !searchErrorMessage && (
            <>
              {productResults.map((item) => (
                <div
                  key={item.id}
                  className={scss.SearchItem}
                  onClick={() =>
                    handleProductClick({ id: item.id, clothes_name: item.clothes_name })
                  }
                >
                  {Array.isArray(item.clothes_img) && item.clothes_img.length > 0 && (
                    <Image
                      src={resolveMediaUrl(item.clothes_img[0].photo)}
                      alt="product"
                      width={100}
                      height={100}
                    />
                  )}
                  <div className={scss.infoSearch}>
                    <p>{item.clothes_name}</p>
                    <p>{item.price}с</p>
                  </div>
                </div>
              ))}

              {categoryResults.length > 0 && (
                <div className={scss.SearchSection}>
                  <span className={scss.SearchSectionTitle}>Категории</span>
                  <div className={scss.SearchSuggestionList}>
                    {categoryResults.map((category) => (
                      <button
                        key={category.category_name}
                        type="button"
                        className={scss.SearchSuggestion}
                        onClick={() => handleCategoryClick(category.category_name)}
                      >
                        {category.category_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasQuery && productResults.length === 0 && categoryResults.length === 0 && (
                <div className={scss.SearchState}>Ничего не найдено</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
