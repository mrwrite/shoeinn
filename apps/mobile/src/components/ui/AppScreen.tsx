import React from "react";
import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../theme/theme";

type AppScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  refreshControl?: ScrollViewProps["refreshControl"];
  style?: StyleProp<ViewStyle>;
  stickyFooter?: React.ReactNode;
};

/**
 * Standard light-mode screen shell for new polished flows. It centralizes the
 * soft marketplace background, safe area, scroll spacing, and sticky footer.
 */
export function AppScreen({
  children,
  scrollable = false,
  contentContainerStyle,
  refreshControl,
  style,
  stickyFooter,
}: AppScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }, style]}>
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.contentContainer, stickyFooter ? styles.contentWithStickyFooter : null, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.staticContent, contentContainerStyle]}>{children}</View>
      )}
      {stickyFooter ? (
        <View
          style={[
            styles.sticky,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderSoft,
            },
            theme.shadows.floating,
          ]}
        >
          {stickyFooter}
        </View>
      ) : null}
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
    padding: 16,
    paddingBottom: 32,
  },
  contentWithStickyFooter: {
    paddingBottom: 132,
  },
  staticContent: {
    padding: 16,
  },
  sticky: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 28,
    borderWidth: 1,
    padding: 12,
  },
});

export default AppScreen;
