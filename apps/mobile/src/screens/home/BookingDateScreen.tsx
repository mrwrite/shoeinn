import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../../components/ui/AppScreen";
import { BookingStepper } from "../../components/ui/BookingStepper";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { PressableCard } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

const generateDates = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + idx);
    return dt;
  });
};

const bookingSteps = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "details", label: "Details" },
  { key: "pay", label: "Pay" },
];

export default function BookingDateScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingDate">>();
  const { service } = route.params;
  const [selected, setSelected] = useState<string | null>(null);
  const categoryLabel = getServiceCategoryLabel(service);

  const dates = useMemo(() => generateDates(14), []);

  return (
    <AppScreen
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Continue"
            variant="gold"
            disabled={!selected}
            onPress={() => selected && navigation.navigate("BookingTime", { service, date: selected })}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <FlatList
        data={dates}
        keyExtractor={(item) => item.toISOString()}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <BookingStepper steps={bookingSteps} currentIndex={0} />
            <Card variant="marketplace" style={styles.summaryCard}>
              <MediaPlaceholder
                compact
                categorySlug={service.category_slug}
                label={service.name}
                caption={categoryLabel ?? "Premium care service"}
                style={styles.summaryMedia}
              />
              <View style={styles.summaryCopy}>
                <SectionHeader eyebrow="Schedule pickup" title="Choose a date" subtitle={service.name} />
                <View style={styles.badgeRow}>
                  {categoryLabel ? <StatusBadge label={categoryLabel} tone="primary" /> : null}
                  <StatusBadge label="Pickup scheduling" tone="warning" />
                </View>
              </View>
            </Card>
          </View>
        }
        renderItem={({ item }) => {
          const iso = item.toISOString();
          const isSelected = selected === iso;
          return (
            <PressableCard
              onPress={() => setSelected(iso)}
              variant={isSelected ? "elevated" : "outline"}
              style={[
                styles.dateCard,
                {
                  backgroundColor: isSelected ? `${theme.colors.secondary}12` : theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.borderSoft,
                },
              ]}
            >
              <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
                {item.toLocaleDateString(undefined, { weekday: "short" })}
              </Text>
              <Text variant="h3" weight="bold" style={styles.dateNumber}>
                {item.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {isSelected ? "Selected date" : "Available"}
              </Text>
            </PressableCard>
          );
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 16,
    paddingBottom: 140,
    gap: 12,
  },
  column: {
    paddingHorizontal: 16,
    justifyContent: "space-between",
    gap: 12,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 14,
  },
  summaryCard: {
    padding: 0,
    overflow: "hidden",
  },
  summaryMedia: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  summaryCopy: {
    padding: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateCard: {
    flex: 1,
    minHeight: 118,
    marginBottom: 12,
    justifyContent: "center",
    borderRadius: 24,
  },
  dateNumber: {
    marginTop: 6,
    marginBottom: 4,
  },
  footerContent: {
    flexDirection: "row",
  },
});
