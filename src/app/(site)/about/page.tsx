import AboutUs from "../../../appPages/site/components/pages/AboutUs";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "О бренде",
  description:
    "История Jumana, философия бренда, подход к дизайну, качеству и современной скромной женской одежде Made in Kyrgyzstan.",
  path: "/about",
});

const page = () => {
  return (
    <div>
      <AboutUs />
    </div>
  );
};

export default page;
