"use client";
import ReduxProvider from "../providers/ReduxProvider";
import RealtimeBridge from "../providers/RealtimeBridge";
import { SessionProvider } from "../providers/SessionProvider";
import React, { FC, ReactNode } from "react";

interface RootLayoutClientProps {
  children: ReactNode;
}
const RootLayoutClient: FC<RootLayoutClientProps> = ({ children }) => {
  return (
    <ReduxProvider>
      <SessionProvider>
        <RealtimeBridge />
        {children}
      </SessionProvider>
    </ReduxProvider>
  );
};

export default RootLayoutClient;
