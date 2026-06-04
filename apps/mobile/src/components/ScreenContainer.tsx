import React from "react";
import { ScrollView, ScrollViewProps, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../theme/theme";

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  stickyFooter?: React.ReactNode;
}

export function ScreenContainer({ children, scrollable = false, contentContainerStyle, stickyFooter }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {scrollable ? (
        <ScrollView style={styles.flex} contentContainerStyle={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentContainerStyle]}>{children}</View>
      )}
      {stickyFooter ? <View style={styles.sticky}>{stickyFooter}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  sticky: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
});

export default ScreenContainer;
