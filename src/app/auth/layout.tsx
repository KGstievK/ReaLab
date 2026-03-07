"use client";
import { FC, ReactNode } from "react";
import LayoutAuth from "../../appPages/auth/components/layout/LayoutAuth";
interface LayoutType {
  children: ReactNode;
}
const Layout: FC<LayoutType> = ({ children }) => {
  return <LayoutAuth>{children}</LayoutAuth>;
};
export default Layout;
