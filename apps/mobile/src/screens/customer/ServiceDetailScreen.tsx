import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import type { HomeStackParamList } from "../../navigation/types";

export default function ServiceDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, "ServiceDetail">>();
  const route = useRoute<RouteProp<HomeStackParamList, "ServiceDetail">>();
  const { service } = route.params;

  const stickyCTA = (
    <PrimaryButton label="Continue Booking" onPress={() => navigation.navigate("BookingDate", { service })} />
  );

  return (
    <ScreenContainer scrollable stickyFooter={stickyCTA} contentContainerStyle={{ paddingBottom: 120 }}>
      <LinearGradient
        colors={["#0F4C5C", "#1B998B"]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.heroTitle}>{service.name}</Text>
        <Text style={styles.heroSubtitle}>${(service.price_cents / 100).toFixed(2)} · {service.duration_minutes} mins</Text>
      </LinearGradient>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's included</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Hand wash upper and midsole</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Deodorizing and sanitation</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Detailing for laces and insole</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
    justifyContent: "flex-end",
  },
  heroTitle: {
    color: "#F8F9FA",
    fontSize: 24,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#E5E7EB",
    fontSize: 15,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    color: "#1B998B",
    marginRight: 6,
  },
  bulletText: {
    color: "#4B5563",
    flex: 1,
  },
});
