import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import type { HomeStackParamList } from "../../navigation/types";

function generateNextDays(count: number) {
  const today = new Date();
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

export default function BookingDateScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, "BookingDate">>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { service } = route.params;
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => generateNextDays(14), []);

  const formatted = (date: Date) => date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a date</Text>
        <Text style={styles.subtitle}>{service.name}</Text>
      </View>
      <FlatList
        data={days}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        keyExtractor={(item) => item.toISOString()}
        renderItem={({ item }) => {
          const iso = item.toISOString();
          const isSelected = selected === iso;
          return (
            <Pressable
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(iso)}
            >
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{formatted(item)}</Text>
            </Pressable>
          );
        }}
      />
      <View style={{ padding: 16 }}>
        <PrimaryButton
          label="Continue"
          disabled={!selected}
          onPress={() => selected && navigation.navigate("BookingTime", { service, date: selected })}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2933",
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  cardSelected: {
    borderColor: "#1B998B",
    borderWidth: 2,
  },
  cardLabel: {
    fontSize: 16,
    color: "#1F2933",
  },
  cardLabelSelected: {
    color: "#1B998B",
    fontWeight: "700",
  },
});
