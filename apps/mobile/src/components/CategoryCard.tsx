import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";

interface Props {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryCard({ label, iconName, selected, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        theme.shadows.card,
        { backgroundColor: selected ? theme.colors.emeraldAccent : theme.colors.surfaceLight },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={28} color={selected ? theme.colors.surfaceLight : theme.colors.peacockPrimary} />
      </View>
      <Text style={[styles.label, selected && { color: theme.colors.surfaceLight }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 96,
    height: 96,
    borderRadius: 16,
    marginRight: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(15,76,92,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2933",
    textAlign: "center",
  },
});

export default CategoryCard;
