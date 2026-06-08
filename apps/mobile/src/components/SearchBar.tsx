import React from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { brandCopy } from "../content/brandCopy";
import { useTheme } from "../theme/theme";

interface SearchBarProps extends Pick<TextInputProps, "value" | "onChangeText" | "onSubmitEditing" | "editable"> {
  onPress?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, onSubmitEditing, editable = true, onPress, placeholder }: SearchBarProps) {
  const theme = useTheme();
  const content = (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSoft }, theme.shadows.soft]}>
      <Ionicons name="search" size={18} color={theme.colors.primary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: theme.colors.textPrimary }]}
        placeholder={placeholder ?? brandCopy.serviceSearchPlaceholder}
        placeholderTextColor={theme.colors.textSubtle}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        editable={editable && !onPress}
        accessibilityLabel="Search services"
      />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable} accessibilityRole="button" accessibilityLabel="Search services">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
  },
  icon: {
    marginRight: 8,
  },
});

export default SearchBar;
