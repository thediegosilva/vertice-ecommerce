"use client";

import { useEffect } from "react";
import { useCart } from "./providers";

export function RefreshCart() {
  const { refresh } = useCart();
  useEffect(() => {
    refresh();
  }, [refresh]);
  return null;
}
