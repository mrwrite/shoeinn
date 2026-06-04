import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { getAvailability } from "../../api/http";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card, PressableCard } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

const bookingSteps = [
  { key: "service", label: "Service" },
  { key: "schedule", label: "Schedule" },
  { key: "details", label: "Details" },
  { key: "review", label: "Review" },
  { key: "payment", label: "Payment" },
];

const formatPrice = (cents: number) => `$${Math.round(cents / 100)}`;

const formatDuration = (minutes: number) => {
  if (minutes >= 120) {
    return `${Math.round(minutes / 60)} hours`;
  }

  return `${minutes} mins`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const getDayPart = (iso: string) => {
  const hour = new Date(iso).getHours();
  if (hour < 12) {
    return "Morning";
  }
  if (hour < 17) {
    return "Afternoon";
  }
  return "Evening";
};

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

  const fallbackSlots = useMemo(() => {
    const times = ["10:00", "12:00", "14:00", "16:00", "18:00"];
    return times.map((time) => {
      const start = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      start.setHours(hours, minutes, 0, 0);
      return start.toISOString();
    });
  }, [date]);

  const slots = availabilityQuery.data ?? [];
  const displaySlots = slots.length > 0 ? slots : fallbackSlots;
  const selectedDate = new Date(date);

  return (
    <AppScreen
      scrollable
      contentContainerStyle={styles.content}
      stickyFooter={
        <Button
          label="Review Details"
          variant="gold"
          disabled={!selected}
          rightIcon={<Ionicons name="arrow-forward" size={22} color={theme.colors.textPrimary} />}
          onPress={() => selected && navigation.navigate("BookingConfirm", { service, date, time: selected })}
        />
      }
    >
      <BookingTopBar onBack={() => navigation.goBack()} />
      <LuxuryStepper currentIndex={2} />

      <View style={styles.heroCopy}>
        <Text variant="display" weight="regular" style={styles.title}>
          Select Time
        </Text>
        <Text variant="body" color={theme.colors.textMuted}>
          Choose a convenient time for your appointment.
        </Text>
      </View>

      <ServiceDetailsCard service={service} categoryLabel={categoryLabel} selectedDate={selectedDate} />

      <View style={styles.sectionHeader}>
        <Text variant="h2" weight="regular">
          Available Times
        </Text>
        <View style={styles.timezoneRow}>
          <Ionicons name="time-outline" size={17} color={theme.colors.textMuted} />
          <Text variant="bodySmall" color={theme.colors.textMuted}>
            All times are in Eastern Time (ET)
          </Text>
        </View>
      </View>

      <View style={styles.slotList}>
        {displaySlots.map((slot) => {
          const isSelected = selected === slot;
          return (
            <PressableCard
              key={slot}
              onPress={() => setSelected(slot)}
              variant={isSelected ? "elevated" : "outline"}
              style={[
                styles.slotCard,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.borderSoft,
                },
              ]}
            >
              <View
                style={[
                  styles.slotIcon,
                  {
                    backgroundColor: isSelected ? theme.colors.accent : theme.colors.accentSoft,
                  },
                ]}
              >
                <Ionicons name="time-outline" size={22} color={isSelected ? theme.colors.surfaceElevated : theme.colors.accentPressed} />
              </View>
              <View style={styles.slotCopy}>
                <Text variant="h2" weight="regular" color={isSelected ? theme.colors.surfaceElevated : theme.colors.textPrimary}>
                  {formatTime(slot)}
                </Text>
                <Text variant="bodySmall" color={isSelected ? "rgba(255,255,255,0.82)" : theme.colors.textMuted}>
                  {getDayPart(slot)}
                </Text>
              </View>
              {isSelected ? (
                <View style={styles.selectedCheck}>
                  <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={24} color={theme.colors.textMuted} />
              )}
            </PressableCard>
          );
        })}
      </View>

      {availabilityQuery.isLoading ? <LoadingState label="Checking availability" /> : null}

      <Card variant="outline" style={styles.noticeCard}>
        <View style={[styles.noticeIcon, { backgroundColor: theme.colors.accentSoft }]}>
          <Ionicons name="shield-checkmark" size={22} color={theme.colors.accentPressed} />
        </View>
        <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.noticeText}>
          Your appointment is confirmed only after final review.
        </Text>
      </Card>
    </AppScreen>
  );
}

function BookingTopBar({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.topBar}>
      <RoundIconButton icon="chevron-back" label="Go back" onPress={onBack} />
      <View style={styles.brandLockup}>
        <View style={styles.brandRow}>
          <Text variant="display" weight="regular" color={theme.colors.primary} style={styles.brand}>
            ShoeInn
          </Text>
          <Ionicons name="sparkles" size={18} color={theme.colors.accent} />
        </View>
        <Text variant="overline" color={theme.colors.accent} style={styles.brandSubhead}>
          Premium Care Marketplace
        </Text>
      </View>
      <RoundIconButton icon="help-circle-outline" label="Help" onPress={() => undefined} />
    </View>
  );
}

function RoundIconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.roundIconButton, theme.shadows.soft]}>
      <Ionicons name={icon} size={26} color={theme.colors.textPrimary} />
    </Pressable>
  );
}

function LuxuryStepper({ currentIndex }: { currentIndex: number }) {
  const theme = useTheme();
  return (
    <View style={styles.stepper}>
      {bookingSteps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={step.key} style={styles.stepItem}>
            {index > 0 ? (
              <View
                style={[
                  styles.stepConnector,
                  { backgroundColor: index <= currentIndex ? theme.colors.accent : theme.colors.divider },
                ]}
              />
            ) : null}
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: isComplete ? theme.colors.primary : theme.colors.surfaceElevated,
                  borderColor: isCurrent ? theme.colors.accentPressed : theme.colors.borderSoft,
                },
              ]}
            >
              {isComplete ? (
                <Ionicons name="checkmark" size={18} color={theme.colors.surfaceElevated} />
              ) : (
                <Text variant="bodySmall" weight="bold" color={isCurrent ? theme.colors.primary : theme.colors.textMuted}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              variant="caption"
              weight={isCurrent ? "bold" : "medium"}
              color={isCurrent ? theme.colors.primary : theme.colors.textMuted}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ServiceDetailsCard({
  service,
  categoryLabel,
  selectedDate,
}: {
  service: HomeStackParamList["BookingTime"]["service"];
  categoryLabel?: string | null;
  selectedDate: Date;
}) {
  const theme = useTheme();
  return (
    <Card variant="marketplace" style={styles.detailsCard}>
      <View style={styles.serviceIntroRow}>
        <MediaPlaceholder
          compact
          categorySlug={service.category_slug}
          label={categoryLabel ?? "Premium care"}
          caption={service.name}
          style={styles.detailsMedia}
        />
        <View style={styles.detailsBody}>
          <View style={[styles.providerPill, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text variant="caption" weight="bold" color={theme.colors.primary}>
              {categoryLabel ?? "Shoe care"}
            </Text>
            <Ionicons name="shield-checkmark" size={15} color={theme.colors.accentPressed} />
          </View>
          <Text variant="h2" weight="regular" numberOfLines={2}>
            {service.name}
          </Text>
          <View style={styles.summaryMetaRow}>
            <IconText icon="time-outline" label={formatDuration(service.duration_minutes)} />
            <IconText icon="pricetag-outline" label={categoryLabel ?? "Premium care"} />
          </View>
        </View>
        <Text variant="h2" weight="bold" color={theme.colors.primary} style={styles.summaryPrice}>
          {formatPrice(service.price_cents)}
        </Text>
      </View>

      <View style={[styles.detailDivider, { backgroundColor: theme.colors.divider }]} />

      <View style={styles.appointmentMetaRow}>
        <AppointmentMeta
          icon="calendar-outline"
          label="Date"
          value={selectedDate.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        />
        <AppointmentMeta icon="location-outline" label="Location" value="Pickup address added later" />
        <AppointmentMeta icon="person-outline" label="Provider" value={categoryLabel ?? "ShoeInn Care"} />
      </View>
    </Card>
  );
}

function IconText({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.iconText}>
      <Ionicons name={icon} size={17} color={theme.colors.textMuted} />
      <Text variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function AppointmentMeta({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.appointmentMeta}>
      <Ionicons name={icon} size={28} color={theme.colors.accentPressed} />
      <View style={styles.appointmentMetaCopy}>
        <Text variant="caption" color={theme.colors.textMuted}>
          {label}
        </Text>
        <Text variant="caption" weight="semibold" numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 132,
    gap: 22,
  },
  topBar: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  brandLockup: {
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brand: {
    fontSize: 38,
    lineHeight: 42,
  },
  brandSubhead: {
    fontSize: 9,
    lineHeight: 13,
  },
  stepper: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stepConnector: {
    position: "absolute",
    left: "-50%",
    right: "50%",
    top: 19,
    height: 2,
  },
  heroCopy: {
    gap: 10,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
  },
  detailsCard: {
    borderRadius: 18,
    padding: 18,
    gap: 18,
  },
  serviceIntroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  detailsMedia: {
    width: 116,
    minHeight: 102,
    borderRadius: 14,
  },
  detailsBody: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  providerPill: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  iconText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 130,
  },
  summaryPrice: {
    alignSelf: "center",
  },
  detailDivider: {
    height: 1,
  },
  appointmentMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  appointmentMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 8,
  },
  appointmentMetaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sectionHeader: {
    gap: 8,
  },
  timezoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotList: {
    gap: 12,
  },
  slotCard: {
    minHeight: 92,
    borderRadius: 18,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  slotIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  slotCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  selectedCheck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  noticeCard: {
    minHeight: 76,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  noticeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeText: {
    flex: 1,
  },
});
