'use client'
import { FC, ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
// import { persistor } from "@/redux/store";
// import { PersistGate } from "redux-persist/integration/react";

interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider: FC<ReduxProviderProps> = ({ children }) => {
  return (
    <>
      <Provider store={store}>
        {/* <PersistGate loading={null} persistor={persistor}> */}
          {children}
        {/* </PersistGate> */}
      </Provider>
    </>
  );
};

export default ReduxProvider;
