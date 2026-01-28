import React from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";

interface SearchBarProps extends Pick<TextInputProps, "value" | "onChangeText" | "onSubmitEditing" | "editable"> {
  onPress?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, onSubmitEditing, editable = true, onPress, placeholder }: SearchBarProps) {
  const theme = useTheme();
  const content = (
    <View style={[styles.container, { backgroundColor: theme.colors.border }]}>
      <Ionicons name="search" size={18} color={theme.colors.mutedText} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder ?? "Search sneaker care services"}
        placeholderTextColor={theme.colors.mutedText}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        editable={editable && !onPress}
      />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
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
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2933",
  },
  icon: {
    marginRight: 8,
  },
});

export default SearchBar;
