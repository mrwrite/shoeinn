import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { login } from "../../api/http";
import { AuthStackParamList } from "../../navigation/AuthStack";
import { useAuthStore } from "../../state/authStore";

const demoAccounts = [
  { label: "Global Admin", email: "admin@shoeinn.com", password: "Password1!" },
  { label: "Pelham Owner", email: "pelham.admin@shoeinn.com", password: "Password1!" },
  { label: "Pelham Driver 1", email: "pelham.driver1@shoeinn.com", password: "Password1!" },
  { label: "Pelham Driver 2", email: "pelham.driver2@shoeinn.com", password: "Password1!" },
  { label: "Helena Owner", email: "helena.admin@shoeinn.com", password: "Password1!" },
  { label: "Helena Driver", email: "helena.driver@shoeinn.com", password: "Password1!" },
  { label: "Customer", email: "customer@shoeinn.com", password: "Password1!" },
];

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const rememberMe = useAuthStore((s) => s.rememberMe);
  const setRememberMe = useAuthStore((s) => s.setRememberMe);
  const [email, setEmail] = useState("customer@shoeinn.com");
  const [password, setPassword] = useState("Password1!");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      await setAuth(data.access_token, data.role, data.user_id, data.full_name, data.email, data.company_id);
    },
    onError: (err: any) => {
      setError(err?.message ?? "Login failed");
    },
  });

  const submit = () => {
    setError(null);
    mutation.mutate({ email, password });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              style={styles.input}
              placeholder="••••••••"
            />
          </View>

          <Pressable style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)} accessibilityRole="checkbox">
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>Remember me</Text>
          </Pressable>

          <Pressable style={[styles.button, mutation.isPending && styles.buttonDisabled]} onPress={submit} disabled={mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>

          <Text style={styles.sectionTitle}>Quick demo logins</Text>
          <View style={styles.demoRow}>
            {demoAccounts.map((acct) => (
              <Pressable
                key={acct.email}
                style={styles.demoButton}
                onPress={() => {
                  setEmail(acct.email);
                  setPassword(acct.password);
                  setError(null);
                  mutation.mutate({ email: acct.email, password: acct.password });
                }}
              >
                <Text style={styles.demoText}>{acct.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => navigation.navigate("Register")}> 
            <Text style={styles.link}>Need an account? Register</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  container: {
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "700", marginTop: 12 },
  subtitle: { fontSize: 16, color: "#4b5563" },
  field: { gap: 4 },
  label: { fontSize: 14, color: "#374151" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#b91c1c", backgroundColor: "#fee2e2", padding: 10, borderRadius: 8 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#111827",
  },
  sectionTitle: { fontWeight: "700", marginTop: 6 },
  demoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  demoButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  demoText: { fontWeight: "600" },
  link: { color: "#1d4ed8", marginTop: 8, fontWeight: "600" },
});
