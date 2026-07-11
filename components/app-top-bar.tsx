import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

import { GatheredMark } from "@/components/gathered-mark";
import { useSession } from "@/lib/session";
import { colors, fonts, spacing } from "@/lib/theme";

type AppTopBarProps = {
  searchOpen?: boolean;
  onSearchPress?: () => void;
};

export function AppTopBar({ searchOpen = false, onSearchPress }: AppTopBarProps) {
  const { user } = useSession();
  const ownerName = user?.name ?? "Capsule owner";
  const useDemoAvatar = user?.email === "test@example.com";

  return (
    <View
      style={{
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <Link href="/" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to My capsules"
          style={({ pressed }) => ({
            minHeight: 44,
            justifyContent: "center",
            opacity: pressed ? 0.66 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <GatheredMark size={30} />
            <Text
              selectable={false}
              style={{
                color: colors.ink,
                fontFamily: fonts.body,
                fontSize: 20,
                lineHeight: 25,
                fontWeight: "600",
                letterSpacing: -0.6,
              }}
            >
              Capsule
            </Text>
          </View>
        </Pressable>
      </Link>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xxs }}>
        {onSearchPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searchOpen ? "Close search" : "Search capsules"}
            onPress={onSearchPress}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.55 : 1,
            })}
          >
            {searchOpen ? <CloseGlyph /> : <SearchGlyph />}
          </Pressable>
        ) : null}

        <Link href="/profile" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open profile for ${ownerName}`}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.55 : 1,
            })}
          >
            {useDemoAvatar ? (
              <Image
                accessibilityIgnoresInvertColors
                source={require("../assets/demo-avatar-v2.jpg")}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  borderWidth: 1,
                  borderColor: colors.lineStrong,
                }}
              />
            ) : (
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.lineStrong,
                  backgroundColor: colors.surface,
                }}
              >
                <Text
                  selectable={false}
                  style={{
                    color: colors.ink,
                    fontFamily: fonts.body,
                    fontSize: 12,
                    lineHeight: 14,
                    fontWeight: "700",
                  }}
                >
                  {profileInitials(ownerName)}
                </Text>
              </View>
            )}
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

function SearchGlyph() {
  return (
    <View style={{ width: 23, height: 23, position: "relative" }}>
      <View
        style={{
          width: 15,
          height: 15,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: colors.ink,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 1,
          bottom: 3,
          width: 9,
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.ink,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

function CloseGlyph() {
  return (
    <Text
      selectable={false}
      style={{
        color: colors.ink,
        fontFamily: fonts.body,
        fontSize: 25,
        lineHeight: 27,
        fontWeight: "400",
      }}
    >
      ×
    </Text>
  );
}

function profileInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join("") || "C";
}
