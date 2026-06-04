import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { TextInput, View, StyleSheet, TextInputProps } from "react-native";

import { useTheme } from "../../theme/theme";

export function SearchBar(props: TextInputProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSoft }, theme.shadows.soft]}>
      <Ionicons name="search" size={18} color={theme.colors.primary} />
      <TextInput
        placeholder="Search services"
        placeholderTextColor={theme.colors.textSubtle}
        style={[styles.input, { color: theme.colors.textPrimary }]}
        accessibilityLabel={props.accessibilityLabel ?? "Search"}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
});

export default SearchBar;
