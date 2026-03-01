import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { listServices } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ServiceCard } from "../../components/ServiceCard";
import { Text } from "../../components/ui/Text";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import type { Service } from "../../types/booking";

export default function ProviderMenuScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "ProviderMenu">>();
  const { company } = route.params;

  const servicesQuery = useQuery<Service[]>({
    queryKey: ["services", company.id],
    queryFn: () => listServices(company.id),
  });

  const services = useMemo(
    () =>
      (servicesQuery.data ?? []).map((svc) => ({
        ...svc,
        company_id: svc.company_id ?? company.id,
      })),
    [servicesQuery.data, company.id],
  );

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="caption" weight="semibold" color={theme.colors.mutedText}>
          Provider
        </Text>
        <Text variant="title" weight="bold" style={{ marginTop: 6 }}>
          {company.name}
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
          {[company.city, company.state].filter(Boolean).join(", ") || "Serving your area"}
        </Text>
      </View>

      {servicesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.peacockPrimary} />
        </View>
      ) : servicesQuery.isError ? (
        <View style={styles.center}>
          <Text color={theme.colors.danger} weight="semibold">
            Unable to load services
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
            Check your connection and try again.
          </Text>
        </View>
      ) : services.length === 0 ? (
        <View style={styles.center}>
          <Text weight="semibold">No services available</Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            Please check back later.
          </Text>
        </View>
      ) : (
        services.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            onPress={(service) => navigation.navigate("ServiceDetail", { service })}
            onBook={(service) => navigation.navigate("BookingDate", { service })}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
    marginBottom: 4,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 6,
  },
});
