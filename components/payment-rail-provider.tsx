"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { TippitRail } from "@/lib/tippit/types";

type PaymentRailContextValue = {
  rail: TippitRail;
  setRail: (rail: TippitRail) => void;
};

const PaymentRailContext = createContext<PaymentRailContextValue | null>(null);

/** Wrap pages that need a switchable payment rail (tip checkout, pay flow). */
export function PaymentRailProvider({
  defaultRail = "magicblock",
  children
}: {
  defaultRail?: TippitRail;
  children: ReactNode;
}) {
  const [rail, setRail] = useState<TippitRail>(defaultRail);
  return (
    <PaymentRailContext.Provider value={{ rail, setRail }}>
      {children}
    </PaymentRailContext.Provider>
  );
}

export function usePaymentRail() {
  const ctx = useContext(PaymentRailContext);
  if (!ctx) throw new Error("usePaymentRail must be used inside <PaymentRailProvider>");
  return ctx;
}
