import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { listServices } from "../../api/http";
import { ServiceCard } from "../../components/ServiceCard";
import { CategoryChip } from "../../components/ui/CategoryChip";
import { SearchBar } from "../../components/ui/SearchBar";
import { Text } from "../../components/ui/Text";
import type { HomeStackParamList } from "../../navigation/RootTabs";
import { useTheme } from "../../theme/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Service } from "../../types/booking";

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => listServices(),
  });

  const services = data ?? [];
  const categories = useMemo(() => {
    const unique = new Set<string>();
    services.forEach((svc) => {
      const label = svc.slug?.split("-")[0] ?? svc.name.split(" ")[0];
      unique.add(label);
    });
    return Array.from(unique);
  }, [services]);

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      const matchesSearch = svc.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category ? svc.slug?.includes(category) || svc.name.includes(category) : true;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, category]);

  const locationLabel = services[0]?.company_id ? "Local provider" : "Your city";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.surfaceLight }} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text variant="caption" weight="semibold" color={theme.colors.mutedText}>
            {locationLabel}
          </Text>
          <Text variant="title" weight="bold" style={{ marginTop: 6 }}>
            Book care on demand
          </Text>
        </View>
        <View style={styles.locationPill}>
          <Ionicons name="location" size={16} color={theme.colors.surfaceLight} />
          <Text weight="semibold" style={{ color: theme.colors.surfaceLight }}>
            Nearby
          </Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        <CategoryChip label="All" selected={!category} onPress={() => setCategory(null)} />
        {categories.map((cat) => (
          <CategoryChip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}> 
          <ActivityIndicator color={theme.colors.peacockPrimary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text color={theme.colors.danger} weight="semibold">
            Unable to load services
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
            Check your connection and try again.
          </Text>
          <View style={{ height: 12 }} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text weight="semibold">No services found</Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            Adjust filters or try a new search.
          </Text>
        </View>
      ) : (
        filtered.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            onPress={(service) => navigation.navigate("ServiceDetail", { service })}
            onBook={(service) => navigation.navigate("BookingDate", { service })}
          />
        ))
      )}

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  locationPill: {
    backgroundColor: "#0F4C5C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categories: {
    marginVertical: 4,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
});
