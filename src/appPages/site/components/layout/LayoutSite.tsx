import { FC, ReactNode, useEffect, useRef, useState } from "react";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import scss from "./LayoutSite.module.scss";
import Tabbar from "../ui/TabBar/Tabbar";

interface LayoutSiteProps {
  children: ReactNode;
}

const LayoutSite: FC<LayoutSiteProps> = ({ children }) => {
  const [isMobileChromeHidden, setIsMobileChromeHidden] = useState(false);
  const lastScrollY = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 750px)");
    const scrollThreshold = 10;

    const syncScrollState = () => {
      if (!mediaQuery.matches) {
        setIsMobileChromeHidden(false);
      }

      lastScrollY.current = Math.max(window.scrollY, 0);
    };

    const updateMobileChromeVisibility = () => {
      animationFrameId.current = null;

      if (!mediaQuery.matches) {
        setIsMobileChromeHidden(false);
        return;
      }

      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 12) {
        setIsMobileChromeHidden(false);
      } else if (scrollDelta > scrollThreshold) {
        setIsMobileChromeHidden(true);
      } else if (scrollDelta < -scrollThreshold) {
        setIsMobileChromeHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const onScroll = () => {
      if (animationFrameId.current !== null) {
        return;
      }

      animationFrameId.current = window.requestAnimationFrame(updateMobileChromeVisibility);
    };

    syncScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncScrollState);
    mediaQuery.addEventListener("change", syncScrollState);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncScrollState);
      mediaQuery.removeEventListener("change", syncScrollState);

      if (animationFrameId.current !== null) {
        window.cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className={scss.LayoutSite}>
      <Header isMobileHidden={isMobileChromeHidden} />
      <main>{children}</main>
      <Footer />
      <Tabbar isHidden={isMobileChromeHidden} />
    </div>
  );
};

export default LayoutSite;
