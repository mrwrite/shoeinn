import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import type { HomeStackParamList } from "../../navigation/RootTabs";
import { useTheme } from "../../theme/theme";

const generateDates = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + idx);
    return dt;
  });
};

export default function BookingDateScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingDate">>();
  const { service } = route.params;
  const [selected, setSelected] = useState<string | null>(null);

  const dates = useMemo(() => generateDates(14), []);

  return (
    <ScreenContainer
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Continue"
            disabled={!selected}
            onPress={() => selected && navigation.navigate("BookingTime", { service, date: selected })}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <FlatList
        data={dates}
        keyExtractor={(item) => item.toISOString()}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, justifyContent: "space-between" }}
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 140, gap: 12 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text variant="title" weight="bold">
              Choose a date
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
              {service.name}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const iso = item.toISOString();
          const isSelected = selected === iso;
          return (
            <Pressable
              onPress={() => setSelected(iso)}
              style={[
                styles.card,
                { borderColor: isSelected ? theme.colors.tealSecondary : theme.colors.border },
                isSelected && { backgroundColor: `${theme.colors.tealSecondary}11` },
              ]}
            >
              <Text weight="semibold">{item.toLocaleDateString(undefined, { weekday: "short" })}</Text>
              <Text color={theme.colors.mutedText}>{item.toLocaleDateString()}</Text>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 4,
  },
  footerContent: {
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: 16,
  },
});
