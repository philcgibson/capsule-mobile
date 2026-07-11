import { Link, useFocusEffect } from "expo-router";
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
import { type Capsule, listCapsules, readApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  cardStyle,
  colors,
  fonts,
  inputStyle,
  primaryButtonStyle,
  radius,
  secondaryButtonStyle,
  spacing,
  type,
} from "@/lib/theme";

type IndexFilter = "all" | "people" | "places" | "moments";

const indexFilters: Array<{ key: IndexFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "places", label: "Places" },
  { key: "moments", label: "Moments" },
];

export default function CapsuleHome() {
  const { width } = useWindowDimensions();
  const { token } = useSession();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [activeFilter, setActiveFilter] = useState<IndexFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indexedCapsules = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    return [...capsules]
      .sort(compareCapsuleActivity)
      .filter((capsule) => matchesIndexFilter(capsule, activeFilter))
      .filter((capsule) => !query || searchableText(capsule).includes(query));
  }, [activeFilter, capsules, searchQuery]);

  const shellWidth = Math.min(width, 760);
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;
  const contentWidth = Math.max(0, shellWidth - horizontalPadding * 2);
  const columnCount = contentWidth >= 600 ? 3 : 2;
  const cardGap = width < 360 ? spacing.sm : spacing.md;
  const cardWidth = Math.max(
    124,
    Math.floor((contentWidth - cardGap * (columnCount - 1)) / columnCount),
  );
  const refined = searchQuery.trim().length > 0 || activeFilter !== "all";

  const loadCapsules = useCallback(
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

  useFocusEffect(
    useCallback(() => {
      void loadCapsules();
    }, [loadCapsules]),
  );

  function closeSearch() {
    setSearchQuery("");
    setSearchOpen(false);
  }

  function resetIndex() {
    setActiveFilter("all");
    setSearchQuery("");
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadCapsules("refresh")}
          tintColor={colors.ink as string}
          colors={[colors.ink as string]}
        />
      }
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
        paddingHorizontal: horizontalPadding,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl + 112,
        gap: spacing.lg,
      }}
    >
      <StatusBar style="dark" />

      <AppTopBar
        searchOpen={searchOpen}
        onSearchPress={() =>
          searchOpen ? closeSearch() : setSearchOpen(true)
        }
      />

      <View style={{ gap: spacing.lg }}>
        <Text
          selectable
          style={[
            type.title,
            {
              fontSize: width < 360 ? 36 : 40,
              lineHeight: width < 360 ? 42 : 46,
            },
          ]}
        >
          My capsules
        </Text>

        <FilterRail value={activeFilter} onChange={setActiveFilter} />

        {searchOpen ? (
          <LibrarySearch value={searchQuery} onChangeText={setSearchQuery} />
        ) : null}
      </View>

      {error ? (
        <ErrorBlock message={error} onRetry={() => void loadCapsules()} />
      ) : null}

      {loading && capsules.length === 0 ? <LoadingState /> : null}

      {!loading && indexedCapsules.length === 0 ? (
        <EmptyState refined={refined} onReset={resetIndex} />
      ) : null}

      {indexedCapsules.length > 0 ? (
        <IndexGrid
          capsules={indexedCapsules}
          cardGap={cardGap}
          cardWidth={cardWidth}
        />
      ) : null}
    </ScrollView>
  );
}

function FilterRail({
  value,
  onChange,
}: {
  value: IndexFilter;
  onChange: (filter: IndexFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={{ gap: spacing.xs }}
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -spacing.xxs }}
    >
      {indexFilters.map((filter) => {
        const selected = value === filter.key;

        return (
          <Pressable
            key={filter.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(filter.key)}
            style={({ pressed }) => ({
              minHeight: 44,
              minWidth: filter.key === "all" ? 64 : 84,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? colors.espresso : "transparent",
              opacity: pressed ? 0.74 : 1,
              paddingHorizontal: spacing.md,
            })}
          >
            <Text
              selectable={false}
              style={{
                color: selected ? colors.white : colors.muted,
                fontFamily: fonts.body,
                fontSize: 14,
                lineHeight: 18,
                fontWeight: selected ? "700" : "500",
              }}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LibrarySearch({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <TextInput
      accessibilityLabel="Find a capsule"
      autoFocus
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
      onChangeText={onChangeText}
      placeholder="Find a capsule"
      placeholderTextColor={colors.subtle as string}
      returnKeyType="search"
      style={[
        inputStyle,
        {
          minHeight: 52,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          paddingVertical: spacing.xs,
        },
      ]}
      value={value}
    />
  );
}

function IndexGrid({
  capsules,
  cardGap,
  cardWidth,
}: {
  capsules: Capsule[];
  cardGap: number;
  cardWidth: number;
}) {
  return (
    <View
      accessibilityRole="list"
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: cardGap,
      }}
    >
      {capsules.map((capsule) => (
        <IndexCard key={capsule.id} capsule={capsule} width={cardWidth} />
      ))}
    </View>
  );
}

function IndexCard({ capsule, width }: { capsule: Capsule; width: number }) {
  const imageHeight = Math.max(166, Math.round(width * 1.12));

  return (
    <Link href={`/capsules/${capsule.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${capsule.title}`}
        style={({ pressed }) => ({
          width,
          gap: spacing.sm,
          opacity: pressed ? 0.76 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        <View
          style={{
            width,
            height: imageHeight,
            overflow: "hidden",
            borderRadius: radius.lg,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <CapsuleVisual
            title={capsule.title}
            imageUrl={capsule.cover_media?.public_url}
            height={imageHeight}
            compact={width < 170}
            tone={capsuleTone(capsule)}
          />
        </View>

        <View style={{ gap: spacing.xxs, paddingHorizontal: spacing.xxs }}>
          <Text
            selectable
            numberOfLines={2}
            style={{
              color: colors.ink,
              fontFamily: fonts.body,
              fontSize: width < 150 ? 14 : 15,
              lineHeight: width < 150 ? 18 : 20,
              fontWeight: "600",
              letterSpacing: -0.25,
            }}
          >
            {capsule.title}
          </Text>
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: colors.subtle,
              fontFamily: fonts.body,
              fontSize: 12,
              lineHeight: 16,
              fontWeight: "500",
            }}
          >
            {formatItems(capsule.memories_count ?? 0)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function LoadingState() {
  return (
    <View
      style={{
        minHeight: 240,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
      }}
    >
      <ActivityIndicator color={colors.ink as string} />
      <Text selectable style={type.body}>
        Gathering your capsules.
      </Text>
    </View>
  );
}

function EmptyState({
  refined,
  onReset,
}: {
  refined: boolean;
  onReset: () => void;
}) {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}>
      <Text selectable style={type.sectionTitle}>
        {refined ? "Nothing here yet." : "Begin with one capsule."}
      </Text>
      <Text selectable style={type.body}>
        {refined
          ? "Try another filter or search across your whole index."
          : "Choose a moment, add the first memory, then invite people when the tone is clear."}
      </Text>
      {refined ? (
        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => ({
            ...secondaryButtonStyle,
            alignSelf: "flex-start",
            minHeight: 44,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <ButtonText>Show all</ButtonText>
        </Pressable>
      ) : (
        <Link href="/create" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => ({
              ...primaryButtonStyle,
              alignSelf: "flex-start",
              minHeight: 48,
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <ButtonText light>New capsule</ButtonText>
          </Pressable>
        </Link>
      )}
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
        borderRadius: radius.lg,
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
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <ButtonText>Retry</ButtonText>
      </Pressable>
    </View>
  );
}

function ButtonText({
  children,
  light,
}: {
  children: string;
  light?: boolean;
}) {
  return (
    <Text
      selectable={false}
      style={{
        color: light ? colors.white : colors.ink,
        fontFamily: fonts.body,
        fontWeight: "700",
      }}
    >
      {children}
    </Text>
  );
}

function matchesIndexFilter(capsule: Capsule, filter: IndexFilter) {
  switch (filter) {
    case "people":
      return (capsule.contributors_count ?? 0) > 0;
    case "places":
      return Boolean(capsule.location?.trim());
    case "moments":
      return (capsule.memories_count ?? 0) > 0;
    default:
      return true;
  }
}

function searchableText(capsule: Capsule) {
  return normalizeSearch(
    [capsule.title, capsule.description, capsule.location]
      .filter(Boolean)
      .join(" "),
  );
}

function normalizeSearch(value: string | null | undefined) {
  return value?.toLocaleLowerCase().trim() ?? "";
}

function compareCapsuleActivity(first: Capsule, second: Capsule) {
  return capsuleActivityTime(second) - capsuleActivityTime(first);
}

function capsuleActivityTime(capsule: Capsule) {
  const value = capsule.updated_at ?? capsule.created_at;

  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function capsuleTone(capsule: Capsule): CapsuleVisualTone {
  const tones: CapsuleVisualTone[] = ["moss", "clay", "ochre", "ink"];
  const hash = capsule.title
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return tones[hash % tones.length];
}

function formatItems(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}
