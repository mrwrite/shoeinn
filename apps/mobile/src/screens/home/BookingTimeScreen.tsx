import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { getAvailability } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

export default function BookingTimeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingTime">>();
  const { service, date } = route.params;
  const [selected, setSelected] = useState<string | null>(null);

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

  return (
    <ScreenContainer
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Review"
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
        columnWrapperStyle={{ paddingHorizontal: 16, justifyContent: "space-between" }}
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 140, gap: 12 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text variant="title" weight="bold">
              Pick a time
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
              {new Date(date).toDateString()}
            </Text>
            {slots.length === 0 ? (
              <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 6 }}>
                Using generated slots. TODO: backend availability endpoint needed for richer times.
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selected === item;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={[
                styles.card,
                { borderColor: isSelected ? theme.colors.tealSecondary : theme.colors.border },
                isSelected && { backgroundColor: `${theme.colors.tealSecondary}11` },
              ]}
            >
              <Text weight="semibold">{new Date(item).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={availabilityQuery.isLoading ? (
          <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator color={theme.colors.peacockPrimary} />
          </View>
        ) : null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },
  footerContent: {
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: 16,
  },
});
