import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AdminCompaniesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Companies</Text>
      <Text>TODO: implement CRUD UI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f3f4f6" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});
