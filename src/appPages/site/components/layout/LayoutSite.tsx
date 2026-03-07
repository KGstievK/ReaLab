import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import scss from "./LayoutSite.module.scss";
import { FC, ReactNode } from "react";
import Tabbar from "../ui/TabBar/Tabbar";

interface LayoutSiteProps {
  children: ReactNode;
}

const LayoutSite: FC<LayoutSiteProps> = ({ children }) => {
  return (
    <div className={scss.LayoutSite}>
      <Header />
      <main>{children}</main>
      <Footer />
      <Tabbar />
    </div>
  );
};

export default LayoutSite;
