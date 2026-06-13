"use client";

import { createContext, useContext } from "react";

type CrmBackgroundContextValue = {
  setCrmBackgroundImageUrl: (url: string | null) => void;
};

const noopCrmBackgroundContext: CrmBackgroundContextValue = {
  setCrmBackgroundImageUrl: () => undefined
};

export const CrmBackgroundContext = createContext<CrmBackgroundContextValue>(noopCrmBackgroundContext);

export function useCrmBackgroundContext() {
  return useContext(CrmBackgroundContext);
}
