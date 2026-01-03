import React from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { claimAppointment, fetchOpenAppointments } from "../../api/http";
import { AppointmentCard } from "../../components/AppointmentCard";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import type { ProviderStackParamList } from "../../navigation/RootTabs";
import { useTheme } from "../../theme/theme";
import type { ProviderAppointment } from "../../types/company";

export default function ProviderDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ["provider", "open"],
    queryFn: fetchOpenAppointments,
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => claimAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider", "open"] });
    },
    onError: (err: Error) => Alert.alert("Claim failed", err.message),
  });

  const renderItem = ({ item }: { item: ProviderAppointment }) => (
    <AppointmentCard
      appointment={{
        id: item.id,
        customer_name: "Customer",
        customer_phone: "",
        address_line1: null,
        address_line2: null,
        city: item.customer_city,
        state: item.customer_state,
        postal_code: null,
        company_id: undefined,
        service_name: item.service_name,
        start_time: item.start_time,
        status: item.status,
      }}
      onPress={() => navigation.navigate("ProviderAppointmentDetail", { appointment: item })}
      onClaim={() => claimMutation.mutate(item.id)}
      claimable
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surfaceLight }}>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Available jobs
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
          Claim and complete nearby bookings
        </Text>
      </View>
      {appointmentsQuery.isLoading ? (
        <View style={styles.center}> 
          <ActivityIndicator color={theme.colors.peacockPrimary} />
        </View>
      ) : appointmentsQuery.isError ? (
        <View style={styles.center}>
          <Text color={theme.colors.danger} weight="semibold">
            Failed to load jobs
          </Text>
          <Button label="Retry" onPress={() => appointmentsQuery.refetch()} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <FlatList
          data={appointmentsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={appointmentsQuery.isRefetching}
              onRefresh={() => appointmentsQuery.refetch()}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text weight="semibold">No available jobs</Text>
              <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
                Pull to refresh or check back later.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    gap: 4,
  },
  center: {
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

