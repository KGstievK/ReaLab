import type { Metadata } from "next";
import { createPageMetadata } from "@/utils/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Скромная женская одежда",
  description:
    "Jumana — modest fashion бренд из Кыргызстана: женственная и современная одежда, платья, туники, комплекты и хиджабы.",
  path: "/",
});

const HomeLayout = ({ children }: { children: React.ReactNode }) => children;

export default HomeLayout;

