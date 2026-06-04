import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";

import { login } from "../../api/http";
import { getDemoLoginAccounts, getDemoMarketLabel, shouldShowDemoLogins } from "../../auth/demoLogins";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppScreen } from "../../components/AppScreen";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/SectionHeader";
import { Text } from "../../components/ui/Text";
import { brandCopy } from "../../content/brandCopy";
import { AuthStackParamList } from "../../navigation/AuthStack";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const rememberMe = useAuthStore((s) => s.rememberMe);
  const setRememberMe = useAuthStore((s) => s.setRememberMe);
  const [email, setEmail] = useState("customer@shoeinn.com");
  const [password, setPassword] = useState("Password1!");
  const [error, setError] = useState<string | null>(null);
  const showDemoLogins = shouldShowDemoLogins();
  const demoMarketLabel = getDemoMarketLabel();
  const demoAccounts = getDemoLoginAccounts();

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
    <AppScreen scrollable contentContainerStyle={styles.container}>
      <View style={[styles.brandBlock, { backgroundColor: theme.colors.primary }, theme.shadows.floating]}>
        <View style={styles.brandTopRow}>
          <View style={[styles.logoMark, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.18)" }]}>
            <Ionicons name="sparkles" size={24} color={theme.colors.surfaceElevated} />
          </View>
          <View style={[styles.brandPill, { backgroundColor: theme.colors.accent }]}>
            <Text variant="meta" weight="bold" style={{ color: theme.colors.textPrimary }}>
              Premium care
            </Text>
          </View>
        </View>
        <View style={styles.hero}>
          <Text variant="display" weight="bold" style={{ color: theme.colors.surfaceElevated }}>
            {brandCopy.appName}
          </Text>
          <Text color="rgba(255,255,255,0.8)" style={styles.heroCopy}>
            {brandCopy.marketplacePositioning}
          </Text>
        </View>
        <MediaPlaceholder
          compact
          categorySlug="shoes"
          label="Care marketplace"
          caption="Luxury pickup and delivery"
          style={styles.brandMedia}
        />
      </View>

      <AppCard variant="elevated" style={[styles.formCard, { borderColor: theme.colors.borderSoft }]}>
        <SectionHeader
          eyebrow="Welcome back"
          title="Sign in to ShoeInn"
          subtitle={`Use your account or jump into a ${demoMarketLabel} premium care demo role.`}
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: theme.colors.dangerSoft, borderColor: `${theme.colors.danger}33` }]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
            <Text color={theme.colors.danger} weight="semibold" style={styles.errorCopy}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text variant="caption" weight="bold" color={theme.colors.textSecondary}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSoft, color: theme.colors.textPrimary }]}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textSubtle}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" weight="bold" color={theme.colors.textSecondary}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSoft, color: theme.colors.textPrimary }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSubtle}
          />
        </View>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setRememberMe(!rememberMe)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: rememberMe ? theme.colors.primary : theme.colors.borderSoft },
              rememberMe && { backgroundColor: theme.colors.primary },
            ]}
          >
            {rememberMe ? <Ionicons name="checkmark" size={14} color={theme.colors.surfaceElevated} /> : null}
          </View>
          <Text color={theme.colors.textSecondary}>Remember me</Text>
        </Pressable>

        <AppButton label="Sign in" onPress={submit} loading={mutation.isPending} disabled={mutation.isPending} />
      </AppCard>

      {showDemoLogins ? (
        <View style={styles.demoSection}>
          <SectionHeader
            eyebrow="Demo access"
            title="Choose a role"
            subtitle={`Sign in with ${demoMarketLabel} seed data for customer, provider, or company admin views.`}
          />
          <View style={styles.demoGrid}>
            {demoAccounts.map((acct) => (
              <Pressable
                key={acct.email}
                disabled={mutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={`Sign in as ${acct.label}`}
                accessibilityState={{ disabled: mutation.isPending, busy: mutation.isPending }}
                style={({ pressed }) => [
                  styles.demoButton,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.borderSoft,
                    opacity: mutation.isPending ? 0.58 : pressed ? 0.94 : 1,
                  },
                  theme.shadows.soft,
                ]}
                onPress={() => {
                  setEmail(acct.email);
                  setPassword(acct.password);
                  setError(null);
                  mutation.mutate({ email: acct.email, password: acct.password });
                }}
              >
                <View style={[styles.demoIcon, { backgroundColor: theme.colors.accentSoft }]}>
                  <Ionicons name="person-circle-outline" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.demoCopy}>
                  <Text weight="bold">{acct.label}</Text>
                  <Text variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
                    {acct.email}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate("Register")}
        style={styles.registerLink}
        accessibilityRole="button"
        accessibilityLabel="Register a new account"
      >
        <Text weight="bold" color={theme.colors.primary}>
          Need an account? Register
        </Text>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 32,
  },
  brandBlock: {
    borderRadius: 34,
    padding: 18,
    gap: 16,
    overflow: "hidden",
  },
  brandTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  hero: {
    gap: 8,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    maxWidth: 320,
  },
  brandMedia: {
    minHeight: 104,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  formCard: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  input: {
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  errorCopy: {
    flex: 1,
  },
  checkboxRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  demoSection: {
    gap: 12,
  },
  demoGrid: {
    gap: 10,
  },
  demoButton: {
    minHeight: 70,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  demoIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  demoCopy: {
    flex: 1,
    gap: 2,
  },
  registerLink: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
