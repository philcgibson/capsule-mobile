import { Redirect, Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  formatMemoryByline,
  formatMemoryDate,
  formatMemoryText,
} from "@/components/memory-card";
import {
  type Capsule,
  type Memory,
  deleteMemory,
  readApiError,
  showCapsule,
  showMemory,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  cardStyle,
  colors,
  fonts,
  primaryButtonStyle,
  radius,
  secondaryButtonStyle,
  spacing,
  type,
} from "@/lib/theme";
import { AppTopBar } from "@/components/app-top-bar";

export default function MemoryDetailRoute() {
  const { capsuleId, memoryId } = useLocalSearchParams<{
    capsuleId?: string;
    memoryId?: string;
  }>();
  const resolvedCapsuleId = readParam(capsuleId);
  const resolvedMemoryId = readParam(memoryId);
  const { bootstrapping, isAuthenticated, token } = useSession();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingMemory, setDeletingMemory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadMemoryDetail = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      if (!token || !resolvedCapsuleId || !resolvedMemoryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setActionError(null);

      try {
        const [capsuleResponse, memoryResponse] = await Promise.all([
          showCapsule(token, resolvedCapsuleId),
          showMemory(token, resolvedCapsuleId, resolvedMemoryId),
        ]);

        if (!isCancelled()) {
          setCapsule(capsuleResponse.data);
          setMemory(memoryResponse.data);
        }
      } catch (caught) {
        if (!isCancelled()) {
          setError(readApiError(caught));
        }
      } finally {
        if (!isCancelled()) {
          setLoading(false);
        }
      }
    },
    [resolvedCapsuleId, resolvedMemoryId, token],
  );

  useEffect(() => {
    let cancelled = false;

    loadMemoryDetail(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [loadMemoryDetail]);

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

  function backToCapsule() {
    if (resolvedCapsuleId) {
      router.replace(`/capsules/${resolvedCapsuleId}`);
    } else {
      router.replace("/");
    }
  }

  function confirmDeleteMemory() {
    if (!memory || deletingMemory) {
      return;
    }

    Alert.alert(
      "Remove memory?",
      "This removes the memory from the capsule.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: removeMemory },
      ],
    );
  }

  async function removeMemory() {
    if (!token || !resolvedCapsuleId || !resolvedMemoryId) {
      return;
    }

    setDeletingMemory(true);
    setActionError(null);

    try {
      await deleteMemory(token, resolvedCapsuleId, resolvedMemoryId);
      router.replace(`/capsules/${resolvedCapsuleId}`);
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setDeletingMemory(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.xl,
      }}
    >
      <Stack.Screen
        options={{
          title: capsule?.title ?? "Memory",
          headerShown: false,
        }}
      />
      <StatusBar style="dark" />

      <AppTopBar />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to capsule"
        onPress={backToCapsule}
        style={({ pressed }) => ({
          ...secondaryButtonStyle,
          alignSelf: "flex-start",
          minHeight: 44,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <ButtonText>Capsule</ButtonText>
      </Pressable>

      {loading ? <LoadingState /> : null}
      {error ? (
        <ErrorBlock
          message={error}
          onRetry={() => loadMemoryDetail()}
          onBack={backToCapsule}
        />
      ) : null}
      {actionError ? <NoticeBlock message={actionError} /> : null}

      {!loading && !error && !memory ? (
        <MissingMemoryState onBack={backToCapsule} />
      ) : null}

      {memory ? (
        <>
          <View style={{ gap: spacing.xs }}>
            <Text selectable style={type.eyebrow}>
              {formatMemoryByline(memory)}
            </Text>
            <Text selectable style={type.title}>
              {memory.type === "photo" ? "Photo memory" : "Note memory"}
            </Text>
            <Text selectable style={type.body}>
              Saved inside {capsule?.title ?? "this capsule"}.
            </Text>
          </View>

          <MemoryHero memory={memory} />

          <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}>
            <Text selectable style={type.sectionTitle}>
              Provenance
            </Text>
            <ContextRow label="Contributor" value={formatMemoryByline(memory)} />
            <ContextRow label="Saved" value={formatMemoryDate(memory)} />
            <ContextRow label="Capsule" value={capsule?.title ?? "This capsule"} />
            <ContextRow
              label="Format"
              value={memory.type === "photo" ? "Photo" : "Note"}
            />
          </View>

          <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              onPress={backToCapsule}
              style={({ pressed }) => ({
                ...primaryButtonStyle,
                opacity: pressed ? 0.86 : 1,
              })}
            >
              <ButtonText light>Back to capsule</ButtonText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={deletingMemory}
              onPress={confirmDeleteMemory}
              style={({ pressed }) => ({
                ...secondaryButtonStyle,
                borderColor: colors.dangerSoft,
                opacity: pressed ? 0.86 : 1,
              })}
            >
              {deletingMemory ? (
                <ActivityIndicator color={colors.danger as string} />
              ) : (
                <ButtonText danger>Remove memory</ButtonText>
              )}
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function MemoryHero({ memory }: { memory: Memory }) {
  const text = formatMemoryText(memory);
  const byline = formatMemoryByline(memory);
  const date = formatMemoryDate(memory);
  const photoUrl = memory.media?.public_url;

  if (photoUrl) {
    return (
      <View style={{ ...cardStyle, overflow: "hidden" }}>
        <Image
          source={{ uri: photoUrl }}
          resizeMode="cover"
          style={{
            width: "100%",
            aspectRatio: 0.92,
            backgroundColor: colors.surfaceMuted,
          }}
        />
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Text
            selectable
            style={{
              color: colors.ink,
              fontFamily: fonts.display,
              fontSize: 25,
              lineHeight: 33,
            }}
          >
            {text}
          </Text>
          <Text selectable style={type.small}>
            {byline} / {date}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        ...cardStyle,
        padding: spacing.lg,
        gap: spacing.lg,
        backgroundColor: colors.surfaceStrong,
        borderColor: colors.surfaceStrong,
      }}
    >
      <Text
        selectable
        style={{
          color: colors.white,
          fontFamily: fonts.display,
          fontSize: 30,
          lineHeight: 39,
        }}
      >
        {text}
      </Text>
      <Text selectable style={{ ...type.small, color: colors.surfaceMuted }}>
        {byline} / {date}
      </Text>
    </View>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
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
        Opening this memory.
      </Text>
    </View>
  );
}

function NoticeBlock({ message }: { message: string }) {
  return (
    <View
      style={{
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: colors.dangerSoft,
        padding: spacing.md,
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
    </View>
  );
}

function ErrorBlock({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
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
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => ({
            ...secondaryButtonStyle,
            flex: 1,
            opacity: pressed ? 0.86 : 1,
          })}
        >
          <ButtonText>Retry</ButtonText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => ({
            ...secondaryButtonStyle,
            flex: 1,
            opacity: pressed ? 0.86 : 1,
          })}
        >
          <ButtonText>Back</ButtonText>
        </Pressable>
      </View>
    </View>
  );
}

function MissingMemoryState({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}>
      <Text selectable style={type.sectionTitle}>
        This memory is no longer here.
      </Text>
      <Text selectable style={type.body}>
        It may have been removed while you were away.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => ({
          ...primaryButtonStyle,
          alignSelf: "flex-start",
          minHeight: 46,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <ButtonText light>Back to capsule</ButtonText>
      </Pressable>
    </View>
  );
}

function ButtonText({
  children,
  light,
  danger,
}: {
  children: string;
  light?: boolean;
  danger?: boolean;
}) {
  return (
    <Text
      selectable={false}
      style={{
        color: danger ? colors.danger : light ? colors.white : colors.ink,
        fontFamily: fonts.body,
        fontWeight: "600",
      }}
    >
      {children}
    </Text>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
