import Catalog from "./HomeSections/Catalog/Catalog";
import Content from "./HomeSections/Content/Content";
import New from "./HomeSections/New/New";
import Popular from "./HomeSections/Popular/Popular";
import Sale from "./HomeSections/Sale/Sale";
import Welcome from "./HomeSections/Welcome/Welcome";
import scss from "./Home.module.scss";

const Home = () => {
  return (
    <div className={scss.Home}>
      <Welcome />
      <Popular />
      <New />
      <Catalog />
      <Sale />
      <Content />
    </div>
  );
};

export default Home;
