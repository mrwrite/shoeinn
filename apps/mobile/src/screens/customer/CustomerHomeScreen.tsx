import React, { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppHeader } from "../../components/AppHeader";
import { CategoryCard } from "../../components/CategoryCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SearchBar } from "../../components/SearchBar";
import { ServiceCard } from "../../components/ServiceCard";
import { categories, services } from "../../data/mock";
import type { HomeStackParamList } from "../../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function CustomerHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory = selectedCategory ? service.category === selectedCategory : true;
      const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const stickyCTA = (
    <View style={styles.ctaBar}>
      <View>
        <Text style={styles.ctaLabel}>Next available today</Text>
        <Text style={styles.ctaSubtitle}>Sneaker techs near you</Text>
      </View>
      <PrimaryButton label="View Appointments" onPress={() => navigation.navigate("Home")} style={styles.ctaButton} />
    </View>
  );

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 120 }} stickyFooter={stickyCTA}>
      <AppHeader locationLabel="McDonough, GA" title="ShoeInn" />
      <View style={styles.searchWrapper}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((category) => (
          <CategoryCard
            key={category.label}
            label={category.label}
            iconName={category.iconName}
            selected={selectedCategory === category.label}
            onPress={() => setSelectedCategory((prev) => (prev === category.label ? null : category.label))}
          />
        ))}
      </ScrollView>
      <Text style={styles.sectionTitle}>Featured Services</Text>
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <ServiceCard
            service={item as any}
            onPress={(svc) => navigation.navigate("ServiceDetail", { service: svc as any })}
            onBook={(svc) => navigation.navigate("BookingDate", { service: svc as any })}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2933",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ctaBar: {
    backgroundColor: "#0F4C5C",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaLabel: {
    color: "#F8F9FA",
    fontSize: 16,
    fontWeight: "600",
  },
  ctaSubtitle: {
    color: "#E5E7EB",
    fontSize: 13,
    marginTop: 2,
  },
  ctaButton: {
    marginLeft: 12,
    minWidth: 140,
  },
});
