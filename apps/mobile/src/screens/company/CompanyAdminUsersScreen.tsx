import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";

import { createCompanyUser, listCompanyUsers } from "../../api/http";
import type { CompanyUser } from "../../types/company";

type UserListItemProps = { user: CompanyUser };

function UserRow({ user }: UserListItemProps) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listTitle}>{user.full_name}</Text>
      <Text style={styles.listSubtitle}>{user.email}</Text>
      <Text style={styles.listBadge}>{user.role}</Text>
    </View>
  );
}

export default function CompanyAdminUsersScreen() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({ queryKey: ["company", "users"], queryFn: listCompanyUsers });

  const mutation = useMutation({
    mutationFn: () => createCompanyUser({ email, full_name: fullName, password: password || undefined }),
    onSuccess: (result) => {
      setTempPassword(result.temp_password ?? null);
      setError(null);
      setEmail("");
      setFullName("");
      setPassword("");
      usersQuery.refetch();
    },
    onError: (err: Error) => setError(err.message || "Failed to create user"),
  });

  const onSubmit = () => {
    if (!email || !fullName) {
      setError("Email and full name are required");
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Add team member</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput placeholder="Full name" value={fullName} onChangeText={setFullName} style={styles.input} />
        <TextInput
          placeholder="Password (optional)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {tempPassword ? <Text style={styles.success}>Temp password: {tempPassword}</Text> : null}
        <Pressable style={[styles.button, mutation.isPending && styles.buttonDisabled]} disabled={mutation.isPending} onPress={onSubmit}>
          {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create user</Text>}
        </Pressable>

        <Text style={[styles.heading, { marginTop: 24 }]}>Team members</Text>
        {usersQuery.isLoading ? (
          <ActivityIndicator />
        ) : usersQuery.error ? (
          <Text style={styles.error}>Failed to load users</Text>
        ) : (
          <FlatList
            data={usersQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <UserRow user={item} />}
            contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
            ListEmptyComponent={<Text style={styles.empty}>No users yet</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b91c1c", marginBottom: 8 },
  success: { color: "#065f46", marginBottom: 8 },
  listItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  listTitle: { fontWeight: "700" },
  listSubtitle: { color: "#4b5563" },
  listBadge: { marginTop: 4, color: "#111827" },
  empty: { color: "#6b7280", textAlign: "center", marginTop: 12 },
});
