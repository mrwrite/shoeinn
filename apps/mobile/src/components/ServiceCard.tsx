import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { Service } from "../types/models";
import { PrimaryButton } from "./PrimaryButton";

interface Props {
  service: Service;
  onPress?: (service: Service) => void;
  onBook?: (service: Service) => void;
}

export function ServiceCard({ service, onPress, onBook }: Props) {
  const theme = useTheme();

  return (
    <Pressable style={[styles.card, theme.shadows.card]} onPress={() => onPress?.(service)}>
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={service.imageUrl ? { uri: service.imageUrl } : undefined}
          style={styles.image}
          imageStyle={{ borderRadius: 16 }}
        >
          {!service.imageUrl ? (
            <LinearGradient
              colors={[theme.colors.peacockPrimary, theme.colors.tealSecondary]}
              style={styles.placeholder}
            >
              <Ionicons name="color-filter-outline" size={28} color={theme.colors.surfaceLight} />
            </LinearGradient>
          ) : null}
        </ImageBackground>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{service.name}</Text>
          {service.rating ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color={theme.colors.goldHighlight} />
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>${service.price.toFixed(2)} · {service.durationMins} mins</Text>
        <View style={styles.footer}>
          <Text style={styles.category}>{service.category}</Text>
          <PrimaryButton label="Book Now" onPress={() => onBook?.(service)} style={styles.button} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
  },
  imageWrapper: {
    height: 180,
  },
  image: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2933",
    flex: 1,
  },
  meta: {
    color: "#6B7280",
    marginBottom: 10,
  },
  category: {
    color: "#1B998B",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    color: "#1F2933",
    fontWeight: "600",
  },
  button: {
    flex: 1,
    marginLeft: 12,
  },
});

export default ServiceCard;
