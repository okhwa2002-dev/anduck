"use client";

import { createContext, useContext } from "react";
import useSWR from "swr";
import { codeApi } from "@/api/admin";
import type { CodeGroup } from "@anduck/types";

const CommonCodeContext = createContext<CodeGroup[] | undefined>(undefined);

export function CommonCodeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSWR("common-codes:all", () => codeApi.listGroups());

  return (
    <CommonCodeContext.Provider value={data}>
      {children}
    </CommonCodeContext.Provider>
  );
}

export function useCommonCodeStore() {
  return useContext(CommonCodeContext);
}
