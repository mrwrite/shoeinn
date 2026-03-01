import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { listCompanies } from "../../api/http";
import { ProviderCard } from "../../components/ProviderCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SearchBar } from "../../components/ui/SearchBar";
import { Text } from "../../components/ui/Text";
import { useCityState } from "../../hooks/useCityState";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import type { Company } from "../../types/company";

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [search, setSearch] = useState("");
  const { city, state, loading: locationLoading } = useCityState();

  const companiesQuery = useQuery<Company[]>({
    queryKey: ["companies", city, state, search],
    queryFn: () => listCompanies({ city, state, query: search || undefined }),
  });

  const companies = companiesQuery.data ?? [];
  const filtered = useMemo(() => {
    if (!search) return companies;
    const term = search.toLowerCase();
    return companies.filter((company) =>
      [company.name, company.city ?? "", company.state ?? ""].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [companies, search]);

  const locationLabel = city || state ? [city, state].filter(Boolean).join(", ") : "Nearby";

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text variant="caption" weight="semibold" color={theme.colors.mutedText}>
            {locationLoading ? "Locating..." : locationLabel}
          </Text>
         {/*  <Text variant="title" weight="bold" style={{ marginTop: 6 }}>
            Book care on demand
          </Text> */}
        </View>
        <View style={styles.locationPill}>
          <Ionicons name="location" size={16} color={theme.colors.surfaceLight} />
          <Text weight="semibold" style={{ color: theme.colors.surfaceLight }}>
            Nearby
          </Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search providers" />

      {companiesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.peacockPrimary} />
        </View>
      ) : companiesQuery.isError ? (
        <View style={styles.center}>
          <Text color={theme.colors.danger} weight="semibold">
            Unable to load providers
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
            Check your connection and try again.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text weight="semibold">No providers found</Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            Adjust filters or try a new search.
          </Text>
        </View>
      ) : (
        filtered.map((company) => (
          <ProviderCard
            key={company.id}
            company={company}
            onPress={(selected) => navigation.navigate("ProviderMenu", { company: selected })}
          />
        ))
      )}

      <View style={{ height: 36 }} />
    </ScreenContainer>
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
