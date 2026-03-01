import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { getMyAppointments } from "../../api/http";
import { AppointmentCard } from "../../components/AppointmentCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import type { AppointmentStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { AppointmentSummary } from "../../types/booking";

export default function AppointmentListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppointmentStackParamList>>();
  const role = useAuthStore((s) => s.role);
  const isCustomer = role === "customer";
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: getMyAppointments,
    enabled: isCustomer,
  });

  const renderItem = ({ item }: { item: AppointmentSummary }) => (
    <AppointmentCard
      appointment={item}
      onPress={(appt) => navigation.navigate("AppointmentDetail", { appointmentId: appt.id, summary: appt })}
    />
  );

  if (!isCustomer) {
    return (
      <ScreenContainer contentContainerStyle={styles.center}>
        <Text variant="title" weight="bold">
          Appointments unavailable
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 6, textAlign: "center" }}>
          Appointments are only available for customers.
        </Text>
        <Button label="Go home" onPress={() => navigation.getParent()?.navigate("HomeTab")} style={{ marginTop: 12 }} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Appointments
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
          Track your bookings
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.peacockPrimary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text color={theme.colors.danger} weight="semibold">
            Failed to load appointments
          </Text>
          <Button label="Retry" onPress={() => refetch()} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text weight="semibold">No appointments yet</Text>
              <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
                Book a service to get started.
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    gap: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
});

