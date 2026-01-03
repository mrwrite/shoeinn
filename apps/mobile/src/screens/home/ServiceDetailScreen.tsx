import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import type { HomeStackParamList } from "../../navigation/RootTabs";
import { useTheme } from "../../theme/theme";

const placeholders = [
  "Professional cleaning and inspection",
  "Premium materials and gentle care",
  "Status updates every step",
];

export default function ServiceDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "ServiceDetail">>();
  const { service } = route.params;
  const price = service.price_cents ? service.price_cents / 100 : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surfaceLight }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <LinearGradient
          colors={[theme.colors.peacockPrimary, theme.colors.tealSecondary]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text variant="title" weight="bold" style={{ color: theme.colors.surfaceLight }}>
            {service.name}
          </Text>
          <Text color={theme.colors.surfaceLight} style={{ marginTop: 6 }}>
            {price ? `$${price.toFixed(2)}` : "Pricing"} · {service.duration_minutes} mins
          </Text>
        </LinearGradient>

        <View style={{ padding: 16, gap: 12 }}>
          <Card>
            <Text variant="subtitle" weight="semibold">
              About
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              {service.description || "Book trusted care with transparent pricing and flexible scheduling."}
            </Text>
          </Card>

          <Card>
            <Text variant="subtitle" weight="semibold">
              What’s included
            </Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {placeholders.map((item) => (
                <Text key={item} color={theme.colors.textCharcoal}>
                  • {item}
                </Text>
              ))}
            </View>
            <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              TODO: map backend inclusions once available.
            </Text>
          </Card>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Continue booking"
          onPress={() => navigation.navigate("BookingDate", { service })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    height: 220,
    justifyContent: "flex-end",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
});

