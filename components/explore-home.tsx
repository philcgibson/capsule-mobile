import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  CapsuleVisual,
  type CapsuleVisualTone,
} from "@/components/capsule-visual";
import { AppTopBar } from "@/components/app-top-bar";
import {
  joinPublicCapsule,
  listPublicCapsules,
  readApiError,
  type PublicCapsule,
} from "@/lib/api";
import { formatCount, formatDateRange } from "@/lib/format";
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

export default function ExploreHome() {
  const { width } = useWindowDimensions();
  const { token, user } = useSession();
  const isDemoOwner = user?.email === "test@example.com";
  const [capsules, setCapsules] = useState<PublicCapsule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningCapsuleId, setJoiningCapsuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCapsules = useCallback(
    async (options?: { refresh?: boolean }) => {
      const isRefresh = Boolean(options?.refresh);

      if (!token) {
        setCapsules([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await listPublicCapsules(token);
        setCapsules(
          isDemoOwner
            ? response.data.filter((capsule) => Boolean(capsule.cover_media?.public_url))
            : response.data,
        );
      } catch (caught) {
        setError(readApiError(caught));
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [isDemoOwner, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCapsules();
    }, [loadCapsules]),
  );

  const visibleCapsules = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    if (!query) {
      return capsules;
    }

    return capsules.filter((capsule) =>
      publicCapsuleSearchText(capsule).toLocaleLowerCase().includes(query),
    );
  }, [capsules, searchQuery]);

  const featuredCapsule = visibleCapsules[0] ?? capsules[0] ?? null;
  const heroHeight = Math.round((width - spacing.lg * 2) * (310 / 416));
  const reviewCapsules = featuredCapsule
    ? visibleCapsules.filter((capsule) => capsule.id !== featuredCapsule.id)
    : visibleCapsules;

  const handleRefresh = useCallback(() => {
    void loadCapsules({ refresh: true });
  }, [loadCapsules]);

  const handleJoin = useCallback(
    async (capsule: PublicCapsule) => {
      if (!token || !capsule.can_join || joiningCapsuleId) {
        return;
      }

      setJoiningCapsuleId(capsule.id);
      setError(null);

      try {
        const response = await joinPublicCapsule(token, capsule.id);
        setCapsules((currentCapsules) =>
          currentCapsules.map((currentCapsule) =>
            currentCapsule.id === capsule.id ? response.data : currentCapsule,
          ),
        );
      } catch (caught) {
        setError(readApiError(caught));
      } finally {
        setJoiningCapsuleId(null);
      }
    },
    [joiningCapsuleId, token],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.ink as string}
          colors={[colors.ink as string]}
        />
      }
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl + 120,
        gap: spacing.xl,
      }}
    >
      <StatusBar style="dark" />

      <AppTopBar />

      <View style={{ gap: spacing.xs }}>
        <Text selectable style={type.title}>
          Explore
        </Text>
        <Text selectable style={type.body}>
          Public capsules
        </Text>
      </View>

      {featuredCapsule ? (
        <ExploreHero capsule={featuredCapsule} height={heroHeight} />
      ) : null}

      <View style={{ gap: spacing.md }}>
        <TextInput
          accessibilityLabel="Search public capsules"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setSearchQuery}
          placeholder="Search public capsules"
          placeholderTextColor={colors.subtle as string}
          returnKeyType="search"
          style={[
            inputStyle,
            {
              minHeight: 48,
              borderRadius: radius.xxl,
              paddingVertical: spacing.xs,
            },
          ]}
          value={searchQuery}
        />

        <Text selectable style={type.small}>
          Review public capsules before joining them.
        </Text>
      </View>

      {error ? (
        <ErrorBlock message={error} onRetry={() => loadCapsules()} />
      ) : null}

      <View style={{ gap: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text selectable style={type.sectionTitle}>
            For review
          </Text>
          <Text selectable style={type.small}>
            {formatCount(reviewCapsules.length, "capsule")}
          </Text>
        </View>

        {loading ? (
          <LoadingBlock />
        ) : reviewCapsules.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {reviewCapsules.map((capsule) => (
              <PublicCapsuleCard
                key={capsule.id}
                capsule={capsule}
                joining={joiningCapsuleId === capsule.id}
                onJoin={handleJoin}
              />
            ))}
          </View>
        ) : (
          <EmptyBlock hasQuery={searchQuery.trim().length > 0} />
        )}
      </View>
    </ScrollView>
  );
}

function ExploreHero({
  capsule,
  height,
}: {
  capsule: PublicCapsule;
  height: number;
}) {
  return (
    <View style={{ ...cardStyle, overflow: "hidden" }}>
      <CapsuleVisual
        title={capsule.title}
        imageUrl={capsule.cover_media?.public_url}
        height={height}
        meta={capsule.description ?? capsule.location ?? "Public collection"}
        showTitle
        tone={capsuleTone(capsule)}
      />
    </View>
  );
}

function PublicCapsuleCard({
  capsule,
  joining,
  onJoin,
}: {
  capsule: PublicCapsule;
  joining: boolean;
  onJoin: (capsule: PublicCapsule) => void;
}) {
  const disabled = !capsule.can_join || joining;

  return (
    <View
      style={{
        ...cardStyle,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.xs,
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: radius.md,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: colors.surfaceMuted,
        }}
      >
        <CapsuleVisual
          title={capsule.title}
          imageUrl={capsule.cover_media?.public_url}
          height={96}
          tone={capsuleTone(capsule)}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Text
          selectable
          numberOfLines={2}
          style={{
            color: colors.ink,
            fontFamily: fonts.display,
            fontSize: 18,
            lineHeight: 23,
          }}
        >
          {capsule.title}
        </Text>
        <Text selectable numberOfLines={1} style={type.small}>
          {capsule.location ?? "Public collection"}
        </Text>
        <Text selectable numberOfLines={1} style={type.small}>
          {formatCount(capsule.contributors_count ?? 0, "member")} /{" "}
          {formatCount(capsule.memories_count ?? 0, "memory")}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onJoin(capsule)}
        style={({ pressed }) => ({
          minWidth: 60,
          minHeight: 42,
          borderRadius: radius.md,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: capsule.can_join ? colors.accent : colors.surfaceInset,
          paddingHorizontal: spacing.sm,
          opacity: disabled ? 0.72 : pressed ? 0.86 : 1,
        })}
      >
        {joining ? (
          <ActivityIndicator color={colors.white as string} />
        ) : (
          <Text
            selectable={false}
            style={{
              color: capsule.can_join ? colors.white : colors.muted,
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {joinLabel(capsule)}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function LoadingBlock() {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.sm }}>
      <ActivityIndicator color={colors.ink as string} />
      <Text selectable style={[type.small, { textAlign: "center" }]}>
        Loading public capsules
      </Text>
    </View>
  );
}

function EmptyBlock({ hasQuery }: { hasQuery: boolean }) {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.xs }}>
      <Text selectable style={type.sectionTitle}>
        {hasQuery ? "No matches" : "No public capsules yet"}
      </Text>
      <Text selectable style={type.body}>
        {hasQuery
          ? "Try a different search."
          : "Public capsules will appear here when they are available to review."}
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
        ...cardStyle,
        padding: spacing.md,
        gap: spacing.sm,
        borderColor: colors.dangerSoft,
      }}
    >
      <Text selectable style={[type.body, { color: colors.danger }]}>
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
        <Text
          selectable={false}
          style={{
            color: colors.ink,
            fontFamily: fonts.body,
            fontWeight: "600",
          }}
        >
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

function publicCapsuleSearchText(capsule: PublicCapsule) {
  return [
    capsule.title,
    capsule.description,
    capsule.location,
    capsule.join_status,
    formatDateRange(capsule.start_date, capsule.end_date),
  ]
    .filter(Boolean)
    .join(" ");
}

function joinLabel(capsule: PublicCapsule) {
  if (capsule.join_status === "owner") {
    return "Yours";
  }

  if (capsule.join_status === "joined") {
    return "Joined";
  }

  return "Join";
}

function capsuleTone(capsule: PublicCapsule): CapsuleVisualTone {
  const tones: CapsuleVisualTone[] = ["moss", "clay", "ochre"];
  const hash = capsule.id
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return tones[hash % tones.length];
}
