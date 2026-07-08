"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True only after client hydration; avoids the setState-in-effect anti-pattern. */
export function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
