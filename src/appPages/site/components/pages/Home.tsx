import Catalog from "./HomeSections/Catalog/Catalog";
import Content from "./HomeSections/Content/Content";
import New from "./HomeSections/New/New";
import Popular from "./HomeSections/Popular/Popular";
import Sale from "./HomeSections/Sale/Sale";
import Welcome from "./HomeSections/Welcome/Welcome";

const Home = () => {
  return (
    <div>
      <Welcome />
      <New />
      <Popular />
      <Sale />
      <Catalog />
      <Content />
    </div>
  );
};

export default Home;
