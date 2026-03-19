import { Suspense } from "react";
import CatalogReaLabPage from "../../../appPages/site/components/pages/CatalogReaLabPage";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Спецусловия ReaLab",
  description:
    "Спецусловия ReaLab: тендерные предложения, комплекты оснащения и индивидуальные коммерческие сценарии.",
  path: "/sale",
});

const page = () => (
  <Suspense fallback={<div />}>
    <CatalogReaLabPage mode="sale" />
  </Suspense>
);

export default page;
