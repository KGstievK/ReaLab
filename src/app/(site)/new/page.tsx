import { Suspense } from "react";
import CatalogReaLabPage from "../../../appPages/site/components/pages/CatalogReaLabPage";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Новые решения ReaLab",
  description:
    "Новые позиции ReaLab: свежие медтех-решения, обновленные конфигурации и новые линейки оборудования.",
  path: "/new",
});

const page = () => (
  <Suspense fallback={<div />}>
    <CatalogReaLabPage mode="new" />
  </Suspense>
);

export default page;
