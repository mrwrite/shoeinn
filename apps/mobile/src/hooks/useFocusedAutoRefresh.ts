import { useFocusEffect } from "@react-navigation/native";
import React from "react";

type Options = {
  enabled?: boolean;
  intervalMs?: number | null;
  onRefresh: () => void | Promise<void>;
};

export function useFocusedAutoRefresh({
  enabled = true,
  intervalMs = null,
  onRefresh,
}: Options) {
  const refreshRef = React.useRef(onRefresh);

  React.useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useFocusEffect(
    React.useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      void refreshRef.current();

      if (!intervalMs) {
        return undefined;
      }

      const timer = setInterval(() => {
        void refreshRef.current();
      }, intervalMs);

      return () => clearInterval(timer);
    }, [enabled, intervalMs]),
  );
}

export default useFocusedAutoRefresh;
