import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { getAvailability } from "../../api/http";
import { AppScreen } from "../../components/ui/AppScreen";
import { BookingStepper } from "../../components/ui/BookingStepper";
import { Button } from "../../components/ui/Button";
import { Card, PressableCard } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

export default function BookingTimeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingTime">>();
  const { service, date } = route.params;
  const [selected, setSelected] = useState<string | null>(null);
  const categoryLabel = getServiceCategoryLabel(service);

  const availabilityQuery = useQuery({
    queryKey: ["availability", service.id, date],
    queryFn: () => getAvailability(service.id, date),
  });

  const slots = availabilityQuery.data ?? [];
  const fallbackSlots = useMemo(() => {
    const times = ["10:00", "12:00", "14:00", "16:00", "18:00"];
    return times.map((time) => {
      const start = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      start.setHours(hours, minutes, 0, 0);
      return start.toISOString();
    });
  }, [date]);

  const displaySlots = slots.length > 0 ? slots : fallbackSlots;
  const bookingSteps = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "details", label: "Details" },
    { key: "pay", label: "Pay" },
  ];

  return (
    <AppScreen
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Review details"
            variant="gold"
            disabled={!selected}
            onPress={() => selected && navigation.navigate("BookingConfirm", { service, date, time: selected })}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <FlatList
        data={displaySlots}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <BookingStepper steps={bookingSteps} currentIndex={1} />
            <Card variant="marketplace" style={styles.summaryCard}>
              <MediaPlaceholder
                compact
                categorySlug={service.category_slug}
                label="Pickup window"
                caption={service.name}
                style={styles.summaryMedia}
              />
              <View style={styles.summaryCopy}>
                <SectionHeader
                  eyebrow="Pickup window"
                  title="Pick a time"
                  subtitle={new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <View style={styles.badgeRow}>
                  {categoryLabel ? <StatusBadge label={categoryLabel} tone="primary" /> : null}
                  {slots.length === 0 ? <StatusBadge label="Demo time slots" tone="warning" /> : <StatusBadge label="Live availability" tone="success" />}
                </View>
              </View>
            </Card>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selected === item;
          return (
            <PressableCard
              onPress={() => setSelected(item)}
              variant={isSelected ? "elevated" : "outline"}
              style={[
                styles.timeCard,
                {
                  backgroundColor: isSelected ? `${theme.colors.secondary}12` : theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.borderSoft,
                },
              ]}
            >
              <Text variant="h3" weight="bold">
                {new Date(item).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary} style={styles.slotLabel}>
                {isSelected ? "Selected" : "Available pickup"}
              </Text>
            </PressableCard>
          );
        }}
        ListFooterComponent={availabilityQuery.isLoading ? <LoadingState label="Checking availability" /> : null}
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
  timeCard: {
    flex: 1,
    minHeight: 104,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  slotLabel: {
    marginTop: 6,
    textAlign: "center",
  },
  footerContent: {
    flexDirection: "row",
  },
});
