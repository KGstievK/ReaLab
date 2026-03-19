import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { FiArrowRight, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import scss from "./BurgeMenu.relab.module.scss";

type BurgerLink = {
  link: string;
  name: string;
};

interface BurgeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: BurgerLink[];
  profileHref: string;
  cartHref: string;
  isAuthenticated: boolean;
}

const BurgeMenu = ({
  isOpen,
  onClose,
  links,
  profileHref,
  cartHref,
  isAuthenticated,
}: BurgeMenuProps) => {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const focusTimeoutId = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 40);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeoutId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <section className={scss.BurgeMenu} aria-label="Мобильное меню">
      <button
        type="button"
        className={scss.backdrop}
        onClick={onClose}
        aria-label="Закрыть меню"
      />

      <div
        id="mobile-nav-drawer"
        className={scss.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
      >
        <div className="container">
          <div className={scss.content}>
            <div className={scss.topRow}>
              <div className={scss.brandBlock}>
                <span id="mobile-nav-title" className={scss.brandEyebrow}>
                  ReaLab
                </span>
                <p>Медицинское оборудование, собранное в чистый digital-first storefront.</p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className={scss.closeButton}
                onClick={onClose}
                aria-label="Закрыть меню"
              >
                <FiX />
              </button>
            </div>

            <nav className={scss.nav} aria-label="Разделы сайта">
              {links.map((item) => {
                const active = item.link === "/" ? pathname === "/" : pathname?.startsWith(item.link);

                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    className={`${scss.navLink} ${active ? scss.active : ""}`}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.name}</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>

            <div className={scss.quickActions}>
              <Link href={profileHref} className={scss.actionCard} onClick={onClose}>
                <div>
                  <strong>{isAuthenticated ? "Профиль" : "Войти"}</strong>
                  <span>
                    {isAuthenticated
                      ? "Заказы, адреса и закупочная история"
                      : "Авторизуйтесь, чтобы сохранить коммерческие сценарии"}
                  </span>
                </div>
                <FiUser aria-hidden="true" />
              </Link>

              <Link href={cartHref} className={scss.actionCard} onClick={onClose}>
                <div>
                  <strong>Корзина</strong>
                  <span>Перейти к выбранным позициям и оформлению поставки</span>
                </div>
                <FiShoppingBag aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BurgeMenu;
