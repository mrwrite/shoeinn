import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { TextInput, View, StyleSheet, TextInputProps } from "react-native";

import { useTheme } from "../../theme/theme";

export function SearchBar(props: TextInputProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border }]}> 
      <Ionicons name="search" size={18} color={theme.colors.mutedText} />
      <TextInput
        placeholder="Search services"
        placeholderTextColor={theme.colors.mutedText}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});

export default SearchBar;
