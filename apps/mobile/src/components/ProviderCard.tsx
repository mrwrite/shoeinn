import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { Company } from "../types/company";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

interface Props {
  company: Company;
  onPress?: (company: Company) => void;
}

export function ProviderCard({ company, onPress }: Props) {
  const theme = useTheme();
  const location = [company.city, company.state].filter(Boolean).join(", ") || "Location unknown";

  return (
    <Pressable onPress={() => onPress?.(company)} style={{ marginBottom: 12 }}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconBubble, { backgroundColor: theme.colors.peacockPrimary }]}>
            <Ionicons name="storefront" size={18} color={theme.colors.surfaceLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle" weight="semibold">
              {company.name}
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              {location}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: `${theme.colors.tealSecondary}22` }]}> 
            <Text weight="semibold" color={theme.colors.tealSecondary}>
              Open
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
});

export default ProviderCard;
