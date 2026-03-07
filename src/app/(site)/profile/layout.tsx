"use client";
import LayoutProfile from "../../../appPages/site/components/pages/user/components/Layout/LayoutProfile";
import React, { FC, ReactNode } from "react";

interface LayoutType {
  children: ReactNode;
}

const layout: FC<LayoutType> = ({ children }) => {
  return (
    <div>
      <LayoutProfile>{children}</LayoutProfile>
    </div>
  );
};

export default layout;
