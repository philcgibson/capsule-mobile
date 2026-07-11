import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { type Capsule, listCapsules, readApiError, webBaseUrl } from "@/lib/api";
import { AppTopBar } from "@/components/app-top-bar";
import { formatCount } from "@/lib/format";
import { useSession } from "@/lib/session";
import {
  cardStyle,
  colors,
  fonts,
  inputStyle,
  radius,
  secondaryButtonStyle,
  spacing,
  type,
} from "@/lib/theme";

export default function ProfileRoute({
  showBackButton = true,
}: {
  showBackButton?: boolean;
}) {
  const { bootstrapping, deleteMyAccount, isAuthenticated, token, user, signOut } = useSession();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) {
        return;
      }

      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await listCapsules(token);
        setCapsules(response.data);
      } catch (caught) {
        setError(readApiError(caught));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const stats = useMemo(() => {
    const memories = capsules.reduce(
      (total, capsule) => total + (capsule.memories_count ?? 0),
      0,
    );
    return {
      memories,
      capsules: capsules.length,
    };
  }, [capsules]);

  if (bootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.canvas,
        }}
      >
        <ActivityIndicator color={colors.ink as string} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  async function confirmSignOut() {
    Alert.alert("Sign out?", "This removes the saved mobile session.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: handleSignOut,
      },
    ]);
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
      router.replace("/auth");
    } finally {
      setSigningOut(false);
    }
  }

  function confirmDeleteAccount() {
    if (!deletePassword || deletingAccount) {
      return;
    }

    Alert.alert(
      "Permanently delete account?",
      "This removes your profile, capsules, memories, guest links, and stored photos. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: handleDeleteAccount },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setError(null);

    try {
      await deleteMyAccount(deletePassword);
      router.replace("/auth");
    } catch (caught) {
      setError(readApiError(caught));
    } finally {
      setDeletingAccount(false);
    }
  }

  const profileName = user?.name ?? "Capsule profile";
  const profileEmail = user?.email ?? "No email";
  const useDemoAvatar = user?.email === "test@example.com";

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile("refresh")}
          tintColor={colors.ink as string}
          colors={[colors.ink as string]}
        />
      }
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl + (showBackButton ? 0 : 112),
        gap: spacing.xl,
      }}
    >
      <StatusBar style="dark" />

      <AppTopBar />

      {showBackButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to My capsules"
          onPress={() => router.replace("/")}
          style={({ pressed }) => ({
            ...secondaryButtonStyle,
            alignSelf: "flex-start",
            minHeight: 44,
            opacity: pressed ? 0.86 : 1,
          })}
        >
          <ButtonText>My capsules</ButtonText>
        </Pressable>
      ) : null}

      <View style={{ gap: spacing.xs }}>
        <Text selectable style={type.eyebrow}>
          Profile
        </Text>
        <Text selectable style={type.title}>
          Account settings
        </Text>
        <Text selectable style={type.body}>
          The identity behind your capsule relationships.
        </Text>
      </View>

      <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          {useDemoAvatar ? (
            <Image
              accessibilityIgnoresInvertColors
              source={require("../assets/demo-avatar-v2.jpg")}
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            />
          ) : (
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                borderWidth: 1,
                borderColor: colors.line,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <Text
                selectable={false}
                style={{
                  color: colors.ink,
                  fontFamily: fonts.body,
                  fontSize: 22,
                  fontWeight: "600",
                }}
              >
                {initials(profileName)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Text selectable numberOfLines={1} style={type.sectionTitle}>
              {profileName}
            </Text>
            <Text selectable numberOfLines={1} style={type.body}>
              {profileEmail}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.line }} />

        <ProfileRow label="Identity" value="Used on capsule invites" />
        <ProfileRow label="Session" value="Stored securely on this device" />
        <ProfileRow
          label="Guest links"
          value={
            stats.capsules > 0 ? "Available on your capsules" : "None active"
          }
        />
      </View>

      {error ? <ErrorBlock message={error} onRetry={() => loadProfile()} /> : null}

      {loading ? <LoadingState /> : null}

      {!loading ? (
        <View style={{ gap: spacing.md }}>
          <Text selectable style={type.sectionTitle}>
            Your capsules
          </Text>
          <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}>
            <ProfileRow
              label="Capsules"
              value={formatCount(capsules.length, "capsule", "capsules")}
            />
            <ProfileRow
              label="Saved"
              value={formatCount(stats.memories, "memory", "memories")}
            />
            <ProfileRow
              label="Access"
              value="Private — invited people only"
            />
          </View>
        </View>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Text selectable style={type.sectionTitle}>Account help</Text>
        <View style={{ ...cardStyle, padding: spacing.sm, gap: spacing.xs }}>
          <LinkRow label="Reset password" onPress={() => Linking.openURL(`${webBaseUrl}/forgot-password`)} />
          {process.env.EXPO_PUBLIC_PRIVACY_URL ? (
            <LinkRow label="Privacy policy" onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL!)} />
          ) : null}
          {process.env.EXPO_PUBLIC_TERMS_URL ? (
            <LinkRow label="Terms of service" onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_TERMS_URL!)} />
          ) : null}
          {process.env.EXPO_PUBLIC_SUPPORT_EMAIL ? (
            <LinkRow label="Contact support" onPress={() => Linking.openURL(`mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL}`)} />
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={signingOut}
        onPress={confirmSignOut}
        style={({ pressed }) => ({
          ...secondaryButtonStyle,
          borderColor: colors.dangerSoft,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.danger as string} />
        ) : (
          <ButtonText danger>Sign out</ButtonText>
        )}
      </Pressable>

      <View style={{ ...cardStyle, padding: spacing.md, gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showDelete }}
          onPress={() => setShowDelete((current) => !current)}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text selectable={false} style={{ ...type.label, color: colors.danger }}>
            {showDelete ? "Close deletion controls" : "Delete account"}
          </Text>
        </Pressable>
        {showDelete ? (
          <View style={{ gap: spacing.sm }}>
            <Text selectable style={type.small}>
              Permanently removes your account, capsules, memories, guest links, and stored photos.
            </Text>
            <TextInput
              accessibilityLabel="Current password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Current password"
              placeholderTextColor={colors.subtle as string}
              secureTextEntry
              autoComplete="current-password"
              style={inputStyle}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !deletePassword || deletingAccount }}
              disabled={!deletePassword || deletingAccount}
              onPress={confirmDeleteAccount}
              style={({ pressed }) => ({
                ...secondaryButtonStyle,
                borderColor: colors.danger,
                opacity: !deletePassword ? 0.45 : pressed ? 0.82 : 1,
              })}
            >
              {deletingAccount ? <ActivityIndicator color={colors.danger as string} /> : <ButtonText danger>Permanently delete</ButtonText>}
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: spacing.sm,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text selectable={false} style={type.label}>{label}</Text>
    </Pressable>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <Text selectable style={{ ...type.label, flex: 0.8 }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={2}
        style={{ ...type.small, flex: 1.2, textAlign: "right" }}
      >
        {value}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.sm }}>
      <ActivityIndicator color={colors.ink as string} />
      <Text selectable style={{ ...type.body, textAlign: "center" }}>
        Reading this account.
      </Text>
    </View>
  );
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      style={{
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: colors.dangerSoft,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <Text
        selectable
        style={{
          color: colors.danger,
          fontFamily: fonts.body,
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => ({
          ...secondaryButtonStyle,
          alignSelf: "flex-start",
          minHeight: 44,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <ButtonText>Retry</ButtonText>
      </Pressable>
    </View>
  );
}

function ButtonText({
  children,
  danger,
}: {
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <Text
      selectable={false}
      style={{
        color: danger ? colors.danger : colors.ink,
        fontFamily: fonts.body,
        fontWeight: "600",
      }}
    >
      {children}
    </Text>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
