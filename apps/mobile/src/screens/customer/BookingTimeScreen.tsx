import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import type { HomeStackParamList } from "../../navigation/types";

const timeSlots = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];

export default function BookingTimeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingTime">>();
  const { service, date } = route.params;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Pick a time</Text>
        <Text style={styles.subtitle}>{new Date(date).toLocaleDateString()}</Text>
      </View>
      <FlatList
        data={timeSlots}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        keyExtractor={(item) => item}
        renderItem={({ item, index }) => {
          const disabled = index === 2;
          const isSelected = selected === item;
          return (
            <Pressable
              onPress={() => !disabled && setSelected(item)}
              style={[styles.slot, disabled && styles.slotDisabled, isSelected && styles.slotSelected]}
            >
              <Text style={[styles.slotLabel, disabled && styles.slotLabelDisabled, isSelected && styles.slotLabelSelected]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
      <View style={{ padding: 16 }}>
        <PrimaryButton
          label="Review"
          disabled={!selected}
          onPress={() => selected && navigation.navigate("BookingConfirm", { service, date, time: selected })}
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
  slot: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: 4,
  },
  slotSelected: {
    borderWidth: 2,
    borderColor: "#1B998B",
  },
  slotDisabled: {
    backgroundColor: "#E5E7EB",
  },
  slotLabel: {
    fontSize: 16,
    color: "#1F2933",
  },
  slotLabelSelected: {
    color: "#1B998B",
    fontWeight: "700",
  },
  slotLabelDisabled: {
    color: "#9CA3AF",
  },
});
