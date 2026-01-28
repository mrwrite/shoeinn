import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { Service } from "../types/booking";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

interface Props {
  service: Service;
  onPress?: (service: Service) => void;
  onBook?: (service: Service) => void;
}

export function ServiceCard({ service, onPress, onBook }: Props) {
  const theme = useTheme();
  const price = service.price_cents ? service.price_cents / 100 : undefined;

  return (
    <Pressable onPress={() => onPress?.(service)} style={{ marginBottom: 16 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={[styles.image, { backgroundColor: theme.colors.peacockPrimary }]}>
          <Ionicons name="sparkles" color={theme.colors.surfaceLight} size={28} />
          <View style={[styles.badge, { backgroundColor: theme.colors.goldHighlight }]}>
            <Text weight="semibold" style={{ color: theme.colors.textCharcoal }}>
              {service.duration_minutes} mins
            </Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text variant="subtitle" weight="semibold">
            {service.name}
          </Text>
          <Text variant="body" color={theme.colors.mutedText} style={{ marginTop: 4 }} numberOfLines={2}>
            {service.description || "Premium care by trusted specialists."}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag" size={16} color={theme.colors.tealSecondary} />
              <Text weight="semibold" style={{ marginLeft: 6 }}>
                {price ? `$${price.toFixed(2)}` : "Pricing"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={theme.colors.mutedText} />
              <Text style={{ marginLeft: 6 }} color={theme.colors.mutedText}>
                {service.company_id ? "On-site" : "Nearby"}
              </Text>
            </View>
          </View>
          <Button label="Book" onPress={() => onBook?.(service)} style={{ marginTop: 12 }} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 170,
    width: "100%",
  },
  badge: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
  },
  content: {
    padding: 16,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default ServiceCard;
