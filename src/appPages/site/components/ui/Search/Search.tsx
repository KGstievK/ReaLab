import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowRight, FiClock, FiSearch, FiTrendingUp, FiX } from "react-icons/fi";
import searchIcon from "@/assets/icons/Search.svg";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import { useSearchCatalogQuery } from "../../../../../redux/api/search";
import scss from "./Search.module.scss";

const SEARCH_PLACEHOLDER = "Поиск по оборудованию, категории или клиническому сценарию";
const SEARCH_DEBOUNCE_MS = 250;
const RECENT_SEARCHES_KEY = "realab-recent-searches";
const MAX_RECENT_SEARCHES = 5;
const formatPrice = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} KGS`;

const popularSuggestions = [
  { label: "Мониторинг пациентов", href: "/catalog?category=Мониторинг%20пациентов" },
  { label: "Визуальная диагностика", href: "/catalog?category=Визуальная%20диагностика" },
  { label: "Лабораторные системы", href: "/catalog?category=Лабораторные%20системы" },
  { label: "Спецусловия", href: "/sale" },
];

type SearchProductLink = {
  id: number;
  clothes_name: string;
};

const Search = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
  const inputRef = useRef<HTMLInputElement>(null);
  const searchPanelId = useId();
  const searchInputId = useId();

  const productResults = useMemo(() => (hasQuery ? data?.products || [] : []), [data, hasQuery]);
  const categoryResults = data?.categories || [];
  const collectionResults = data?.collections || [];
  const searchError = hasQuery && error ? extractApiErrorInfo(error, "Не удалось выполнить поиск") : null;
  const searchErrorMessage = searchError
    ? getRateLimitAwareMessage(
        searchError,
        "Слишком много поисковых запросов. Попробуйте позже.",
      )
    : "";
  const shouldShowResults = isOpen;

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [query]);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!rawValue) {
        return;
      }

      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item) => typeof item === "string"));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 860px)");

    const applyMode = (matches: boolean) => {
      setIsMobileView(matches);
      if (!matches) {
        setIsOpen(false);
      }
    };

    applyMode(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => applyMode(event.matches);
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobileView) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileView, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (isMobileView) {
      document.body.style.overflow = "hidden";
    }

    const focusTimeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimeoutId);
    };
  }, [isMobileView, isOpen]);

  const persistRecentSearches = (nextValue: string[]) => {
    setRecentSearches(nextValue);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextValue));
    } catch {
      // Ignore storage issues; search still works without persistence.
    }
  };

  const rememberSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    const nextValue = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(
      0,
      MAX_RECENT_SEARCHES,
    );

    persistRecentSearches(nextValue);
  };

  const closeSearch = (clearQuery = false) => {
    setIsOpen(false);
    if (clearQuery) {
      setQuery("");
      setDebouncedQuery("");
    }
  };

  const openSearch = () => {
    setIsOpen((prev) => (isMobileView ? true : !prev));
  };

  const navigateToSearchResults = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    rememberSearch(normalized);
    router.push(`/catalog?search=${encodeURIComponent(normalized)}`);
    closeSearch(true);
  };

  const handleProductClick = (product: SearchProductLink) => {
    rememberSearch(product.clothes_name);
    router.push(buildProductHref(product));
    closeSearch(true);
  };

  const handleCategoryClick = (categoryName: string) => {
    rememberSearch(categoryName);
    router.push(`/catalog?category=${encodeURIComponent(categoryName)}`);
    closeSearch(true);
  };

  const handleSuggestionNavigation = (href: string) => {
    router.push(href);
    closeSearch(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearchResults(typedQuery);
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const clearRecentSearches = () => {
    persistRecentSearches([]);
  };

  const renderDiscoveryState = () => (
    <>
      {recentSearches.length > 0 && (
        <div className={scss.Section}>
          <div className={scss.SectionHeader}>
            <span className={scss.SectionTitle}>Недавние запросы</span>
            <button type="button" className={scss.TextButton} onClick={clearRecentSearches}>
              Очистить
            </button>
          </div>
          <div className={scss.TagList}>
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                className={scss.Tag}
                onClick={() => navigateToSearchResults(item)}
              >
                <FiClock aria-hidden="true" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={scss.Section}>
        <div className={scss.SectionHeader}>
          <span className={scss.SectionTitle}>Популярные переходы</span>
        </div>
        <div className={scss.TagList}>
          {popularSuggestions.map((item) => (
            <button
              key={item.href}
              type="button"
              className={scss.Tag}
              onClick={() => handleSuggestionNavigation(item.href)}
            >
              <FiTrendingUp aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderResultsState = () => {
    if (isDebouncing || isFetching) {
      return <div className={scss.State} role="status" aria-live="polite">Ищем...</div>;
    }

    if (searchErrorMessage) {
      return (
        <div className={`${scss.State} ${scss.StateError}`} role="status" aria-live="polite">
          {searchErrorMessage}
        </div>
      );
    }

    if (productResults.length === 0 && categoryResults.length === 0 && collectionResults.length === 0) {
      return <div className={scss.State} role="status" aria-live="polite">Ничего не найдено</div>;
    }

    return (
      <>
        {productResults.length > 0 && (
          <div className={scss.Section}>
            <div className={scss.SectionHeader}>
              <span className={scss.SectionTitle}>Товары</span>
            </div>
            <div className={scss.ProductList}>
              {productResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={scss.ProductItem}
                  onClick={() =>
                    handleProductClick({ id: item.id, clothes_name: item.clothes_name })
                  }
                >
                  {Array.isArray(item.clothes_img) && item.clothes_img.length > 0 ? (
                    <Image
                      src={resolveMediaUrl(item.clothes_img[0].photo)}
                      alt={item.clothes_name}
                      width={88}
                      height={104}
                    />
                  ) : (
                    <div className={scss.ProductPlaceholder} aria-hidden="true" />
                  )}
                  <div className={scss.ProductInfo}>
                    <p>{item.clothes_name}</p>
                    <span>{formatPrice(Number(item.discount_price || item.price))}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {categoryResults.length > 0 && (
          <div className={scss.Section}>
            <div className={scss.SectionHeader}>
              <span className={scss.SectionTitle}>Категории</span>
            </div>
            <div className={scss.TagList}>
              {categoryResults.map((category) => (
                <button
                  key={category.category_name}
                  type="button"
                  className={scss.Tag}
                  onClick={() => handleCategoryClick(category.category_name)}
                >
                  <span>{category.category_name}</span>
                  <small>{category.count}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {collectionResults.length > 0 && (
          <div className={scss.Section}>
            <div className={scss.SectionHeader}>
              <span className={scss.SectionTitle}>Коллекции</span>
            </div>
            <div className={scss.TagList}>
              {collectionResults.map((collection) => (
                <button
                  key={collection.promo_category}
                  type="button"
                  className={scss.Tag}
                  onClick={() => navigateToSearchResults(collection.promo_category)}
                >
                  <span>{collection.promo_category}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div ref={searchRef} className={scss.Search}>
      <button
        className={scss.Trigger}
        type="button"
        onClick={openSearch}
        aria-label="Открыть поиск"
        aria-haspopup={isMobileView ? "dialog" : "listbox"}
        aria-expanded={isOpen}
        aria-controls={searchPanelId}
      >
        <Image src={searchIcon} alt="Поиск" width={18} height={18} />
      </button>

      {shouldShowResults && (
        <div className={isMobileView ? scss.Overlay : scss.Dropdown}>
          {isMobileView ? (
            <button type="button" className={scss.Backdrop} onClick={() => closeSearch(false)} aria-label="Закрыть поиск" />
          ) : null}

          <div
            id={searchPanelId}
            className={scss.Panel}
            role={isMobileView ? "dialog" : "region"}
            aria-modal={isMobileView ? "true" : undefined}
            aria-label="Поиск по каталогу"
          >
            <div className={scss.PanelHeader}>
              <form className={scss.SearchForm} onSubmit={handleSubmit} role="search">
                <label htmlFor={searchInputId} className={scss.srOnly}>
                  Поиск по каталогу
                </label>
                <FiSearch className={scss.SearchIcon} aria-hidden="true" />
                <input
                  id={searchInputId}
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder={SEARCH_PLACEHOLDER}
                  autoComplete="off"
                  aria-describedby={hasTypedQuery ? `${searchPanelId}-status` : undefined}
                />
                {hasTypedQuery ? (
                  <button
                    className={scss.IconButton}
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Очистить поиск"
                  >
                    <FiX aria-hidden="true" />
                  </button>
                ) : null}
              </form>

              {isMobileView ? (
                <button
                  type="button"
                  className={scss.CloseButton}
                  onClick={() => closeSearch(true)}
                >
                  Закрыть
                </button>
              ) : null}
            </div>

            <div className={scss.PanelBody} id={`${searchPanelId}-status`}>
              {hasTypedQuery ? renderResultsState() : renderDiscoveryState()}
            </div>

            {hasTypedQuery && !searchErrorMessage ? (
              <button
                type="button"
                className={scss.FooterAction}
                onClick={() => navigateToSearchResults(typedQuery)}
              >
                <span>Показать все результаты</span>
                <FiArrowRight aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
