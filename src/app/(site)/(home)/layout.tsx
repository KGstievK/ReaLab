import type { Metadata } from "next";
import { createPageMetadata } from "@/utils/seo";

export const metadata: Metadata = createPageMetadata({
  title: "ReaLab Medical Equipment",
  description:
    "ReaLab — медицинское оборудование для клиник, лабораторий и реабилитационных центров: мониторинг, диагностика, инфузионная терапия и сервисные решения.",
  path: "/",
});

const HomeLayout = ({ children }: { children: React.ReactNode }) => children;

export default HomeLayout;
