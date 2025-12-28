import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { listCompanies } from "../../api/http";
import type { CustomerStackParamList } from "../../navigation/CustomerStack";
import { useAuthStore } from "../../state/authStore";
import { useCompanyStore } from "../../state/companyStore";
import { useBooking } from "../../state/bookingStore";

const CompanyCard: React.FC<{ name: string; city?: string | null; state?: string | null; onPress: () => void }> = ({
  name,
  city,
  state,
  onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
    <Text style={styles.title}>{name}</Text>
    {city || state ? <Text style={styles.meta}>{[city, state].filter(Boolean).join(", ")}</Text> : null}
  </TouchableOpacity>
);

export default function CompanyPickerScreen() {
  const navigation = useNavigation();
  const logout = useAuthStore((s) => s.logout);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);
  const clearCompany = useCompanyStore((s) => s.clearSelectedCompany);
  const resetBooking = useBooking((s) => s.reset);

  const query = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const companies = query.data ?? [];

  useEffect(() => {
    const handleLogout = async () => {
      resetBooking();
      clearCompany();
      await logout();
    };

    navigation.setOptions({
      headerShown: true,
      title: "Choose provider",
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} accessibilityRole="button" style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [clearCompany, logout, navigation, resetBooking]);

  if (query.isLoading && !companies.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Unable to load providers.</Text>
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={companies}
      keyExtractor={(item) => item.id}
      contentContainerStyle={companies.length ? styles.list : styles.center}
      renderItem={({ item }) => (
        <CompanyCard
          name={item.name}
          city={item.city}
          state={item.state}
          onPress={() => {
            resetBooking();
            setSelectedCompany(item);
            navigation.navigate("CompanyServices" as keyof CustomerStackParamList);
          }}
        />
      )}
      refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />}
      ListEmptyComponent={<Text style={styles.empty}>No providers available.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    marginTop: 4,
    color: "#4b5563",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  list: {
    paddingVertical: 12,
  },
  empty: {
    color: "#6b7280",
  },
  error: {
    color: "#ef4444",
  },
  headerButton: {
    padding: 6,
  },
  headerButtonText: {
    color: "#2563eb",
    fontWeight: "700",
  },
});
