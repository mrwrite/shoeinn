import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootTabParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

export function navigateWhenReady(
  action: () => void,
  retries = 8,
  delayMs = 250,
) {
  if (navigationRef.isReady()) {
    action();
    return;
  }
  if (retries <= 0) {
    return;
  }
  setTimeout(() => navigateWhenReady(action, retries - 1, delayMs), delayMs);
}
