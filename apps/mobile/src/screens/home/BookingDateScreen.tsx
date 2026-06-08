import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card, PressableCard } from "../../components/ui/Card";
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

const generateDates = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + idx);
    dt.setHours(12, 0, 0, 0);
    return dt;
  });
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const toIso = (date: Date) => date.toISOString();

const formatPrice = (cents: number) => `$${Math.round(cents / 100)}`;

const formatDuration = (minutes: number) => {
  if (minutes >= 120) {
    return `${Math.round(minutes / 60)} hours`;
  }

  return `${minutes} mins`;
};

const buildCalendarDays = (visibleDate: Date) => {
  const firstOfMonth = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1, 12);
  const daysInMonth = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 0).getDate();
  const leadingDays = firstOfMonth.getDay();
  const previousMonthDays = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let index = leadingDays - 1; index >= 0; index -= 1) {
    cells.push({
      date: new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, previousMonthDays - index, 12),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day, 12), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1, 12),
      inMonth: false,
    });
  }

  return cells;
};

export default function BookingDateScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingDate">>();
  const { service } = route.params;
  const categoryLabel = getServiceCategoryLabel(service);
  const dates = useMemo(() => generateDates(14), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => dates[0]);
  const selectedDate = selected ? new Date(selected) : null;
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const featuredDates = dates.slice(0, 5);

  const selectDate = (date: Date) => {
    setSelected(toIso(date));
    setVisibleMonth(date);
  };

  return (
    <AppScreen
      scrollable
      contentContainerStyle={styles.content}
      stickyFooter={
        <Button
          label="Continue"
          variant="gold"
          disabled={!selected}
          rightIcon={<Ionicons name="arrow-forward" size={22} color={theme.colors.textPrimary} />}
          onPress={() => selected && navigation.navigate("BookingTime", { service, date: selected })}
        />
      }
    >
      <BookingTopBar onBack={() => navigation.goBack()} onClose={() => navigation.navigate("Home")} />
      <LuxuryStepper currentIndex={1} />

      <View style={styles.heroCopy}>
        <Text variant="display" weight="regular" style={styles.title}>
          Select Date
        </Text>
        <Text variant="body" color={theme.colors.textMuted}>
          Choose your preferred date for service.
        </Text>
      </View>

      <ServiceSummaryCard service={service} categoryLabel={categoryLabel} />

      <Card variant="marketplace" style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1, 12))}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text variant="h2" weight="regular">
            {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1, 12))}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((label) => (
            <Text key={label} variant="meta" weight="semibold" color={theme.colors.textMuted} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map(({ date, inMonth }) => {
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const isAvailable = dates.some((candidate) => isSameDay(candidate, date));
            return (
              <Pressable
                key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                accessibilityRole="button"
                accessibilityLabel={date.toDateString()}
                disabled={!isAvailable}
                onPress={() => selectDate(date)}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: theme.colors.primary },
                  !isAvailable && styles.dayCellUnavailable,
                ]}
              >
                <Text
                  variant="h3"
                  weight="regular"
                  color={isSelected ? theme.colors.surfaceElevated : inMonth ? theme.colors.textPrimary : theme.colors.textSubtle}
                >
                  {date.getDate()}
                </Text>
                {isAvailable ? (
                  <View
                    style={[
                      styles.availabilityDot,
                      { backgroundColor: isSelected ? theme.colors.accent : theme.colors.primary },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={styles.sectionGap}>
        <Text variant="h2" weight="regular">
          Available Dates
        </Text>
        <View style={styles.dateRail}>
          {featuredDates.map((date, index) => {
            const iso = toIso(date);
            const isSelected = selected === iso;
            return (
              <PressableCard
                key={iso}
                onPress={() => selectDate(date)}
                variant={isSelected ? "elevated" : "outline"}
                style={[
                  styles.availableDateCard,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.borderSoft,
                  },
                ]}
              >
                <Text variant="caption" weight="semibold" color={isSelected ? theme.colors.surfaceElevated : theme.colors.textSecondary}>
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </Text>
                <Text variant="h3" weight="regular" color={isSelected ? theme.colors.surfaceElevated : theme.colors.textPrimary} style={styles.availableDate}>
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </Text>
                <Text variant="caption" weight="medium" color={isSelected ? theme.colors.accentSoft : theme.colors.accent}>
                  {index + 2} spots left
                </Text>
                <Text variant="bodySmall" weight="bold" color={isSelected ? theme.colors.surfaceElevated : theme.colors.textPrimary} style={styles.availablePrice}>
                  {formatPrice(service.price_cents)}
                </Text>
              </PressableCard>
            );
          })}
        </View>
      </View>

      <Card variant="outline" style={styles.noticeCard}>
        <Ionicons name="time-outline" size={24} color={theme.colors.accent} />
        <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.noticeText}>
          Morning, afternoon, and evening slots available.
        </Text>
      </Card>
    </AppScreen>
  );
}

function BookingTopBar({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
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
      <RoundIconButton icon="close" label="Close" onPress={onClose} />
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

function ServiceSummaryCard({
  service,
  categoryLabel,
}: {
  service: HomeStackParamList["BookingDate"]["service"];
  categoryLabel?: string | null;
}) {
  const theme = useTheme();
  return (
    <Card variant="marketplace" style={styles.summaryCard}>
      <MediaPlaceholder
        compact
        categorySlug={service.category_slug}
        label={categoryLabel ?? "Premium care"}
        caption={service.name}
        style={styles.summaryMedia}
      />
      <View style={styles.summaryBody}>
        <Text variant="h2" weight="regular" numberOfLines={2}>
          {service.name}
        </Text>
        <View style={styles.summaryMetaRow}>
          <IconText icon="person-outline" label={categoryLabel ?? "Shoe care"} />
          <IconText icon="time-outline" label={formatDuration(service.duration_minutes)} />
        </View>
        <View style={[styles.categoryPill, { backgroundColor: theme.colors.surfaceTint }]}>
          <Text variant="caption" weight="semibold" color={theme.colors.primary}>
            {categoryLabel ?? "Premium care"}
          </Text>
        </View>
      </View>
      <Text variant="h2" weight="bold" color={theme.colors.primary} style={styles.summaryPrice}>
        {formatPrice(service.price_cents)}
      </Text>
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
  summaryCard: {
    minHeight: 126,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryMedia: {
    width: 116,
    minHeight: 100,
    borderRadius: 14,
  },
  summaryBody: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  summaryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 130,
  },
  categoryPill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryPrice: {
    alignSelf: "center",
  },
  calendarCard: {
    borderRadius: 18,
    padding: 18,
    gap: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayCellUnavailable: {
    opacity: 0.48,
  },
  availabilityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sectionGap: {
    gap: 14,
  },
  dateRail: {
    flexDirection: "row",
    gap: 10,
  },
  availableDateCard: {
    flex: 1,
    minHeight: 146,
    borderRadius: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  availableDate: {
    textAlign: "center",
  },
  availablePrice: {
    marginTop: 14,
  },
  noticeCard: {
    minHeight: 70,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  noticeText: {
    flex: 1,
  },
});
