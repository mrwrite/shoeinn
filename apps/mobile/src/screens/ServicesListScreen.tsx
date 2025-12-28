import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { listServices } from "../api/http";
import type { Service } from "../types/booking";

interface Props {
  onSelect: (service: Service) => void;
  companyId?: string;
}

const ServiceCard: React.FC<{ service: Service; onPress: () => void }> = ({ service, onPress }) => {
  const title = (service?.name ?? "").toUpperCase();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <Text style={styles.title}>{title}</Text>
      {service.description ? <Text style={styles.description}>{service.description}</Text> : null}
      <Text style={styles.meta}>Duration: {service.duration_minutes} min</Text>
      <Text style={styles.meta}>Price: ${(service.price_cents / 100).toFixed(2)}</Text>
    </TouchableOpacity>
  );
};

const ServicesListScreen: React.FC<Props> = ({ onSelect, companyId }) => {
  const query = useQuery<Service[], Error>({
    queryKey: ["services", companyId ?? "all"],
    queryFn: () => listServices(companyId),
    enabled: Boolean(companyId),
  });
  const services = query.data ?? [];

  React.useEffect(() => {
    console.log("[UI] ServicesListScreen", services.length);
  }, [services.length]);

  if (query.isLoading && !services.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Unable to load services. Pull to retry.</Text>
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />
          }
        />
      </View>
    );
  }

  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ServiceCard service={item} onPress={() => onSelect(item)} />
      )}
      contentContainerStyle={services.length ? undefined : styles.center}
      ListEmptyComponent={<Text style={styles.empty}>No services available.</Text>}
      refreshControl={
        <RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />
      }
    />
  );
};

export default ServicesListScreen;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: "#4b5563",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: {
    fontSize: 16,
    color: "#6b7280",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
});
