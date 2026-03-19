import { Suspense } from "react";
import CatalogReaLabPage from "../../../appPages/site/components/pages/CatalogReaLabPage";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Клинический выбор ReaLab",
  description:
    "Подборка ReaLab с наиболее востребованным оборудованием для клиник, лабораторий и реабилитационных центров.",
  path: "/popular",
});

const page = () => (
  <Suspense fallback={<div />}>
    <CatalogReaLabPage mode="popular" />
  </Suspense>
);

export default page;
