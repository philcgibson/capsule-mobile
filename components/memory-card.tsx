import { Image, Text, View } from "react-native";

import type { Memory } from "@/lib/api";
import { cardStyle, colors, fonts, spacing, type } from "@/lib/theme";

export function MemoryCard({
  memory,
  compact = false,
}: {
  memory: Memory;
  compact?: boolean;
}) {
  const imageUrl = memory.media?.public_url ?? null;
  const memoryText = formatMemoryText(memory);

  if (!imageUrl) {
    return (
      <View
        style={{
          ...cardStyle,
          padding: compact ? spacing.md : spacing.lg,
          gap: spacing.lg,
          backgroundColor: colors.surfaceStrong,
          borderColor: colors.surfaceStrong,
        }}
      >
        <Text
          selectable
          numberOfLines={compact ? 5 : 8}
          style={{
            color: colors.white,
            fontFamily: fonts.display,
            fontSize: compact ? 20 : 25,
            lineHeight: compact ? 27 : 33,
          }}
        >
          {memoryText}
        </Text>
        <MemoryMeta memory={memory} inverted />
      </View>
    );
  }

  return (
    <View
      style={{
        ...cardStyle,
        overflow: "hidden",
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        resizeMode="cover"
        style={{
          width: "100%",
          aspectRatio:
            memory.media?.width && memory.media.height
              ? memory.media.width / memory.media.height
              : 1.12,
          backgroundColor: colors.surfaceMuted,
        }}
      />

      <View
        style={{
          padding: compact ? spacing.sm : spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text
          selectable
          numberOfLines={compact ? 2 : 4}
          style={{
            color: colors.ink,
            fontFamily: fonts.display,
            fontSize: compact ? 18 : 21,
            lineHeight: compact ? 24 : 28,
          }}
        >
          {memoryText}
        </Text>
        <MemoryMeta memory={memory} />
      </View>
    </View>
  );
}

function MemoryMeta({
  memory,
  inverted,
}: {
  memory: Memory;
  inverted?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <Text
        selectable
        numberOfLines={1}
        style={{
          ...type.small,
          flex: 1,
          color: inverted ? colors.surfaceMuted : colors.subtle,
        }}
      >
        {formatMemoryByline(memory)}
      </Text>
      <Text
        selectable
        style={{
          ...type.small,
          color: inverted ? colors.surfaceMuted : colors.subtle,
        }}
      >
        {formatMemoryDate(memory)}
      </Text>
    </View>
  );
}

export function formatMemoryByline(memory: Memory) {
  const guestName = memory.contributor?.guest_name?.trim();

  if (guestName) {
    return `From ${guestName}`;
  }

  if (memory.contributor) {
    return "From guest";
  }

  if (memory.user_id) {
    return "From you";
  }

  return "From owner";
}

export function formatMemoryDate(memory: Memory) {
  if (!memory.created_at) {
    return "Just now";
  }

  return new Date(memory.created_at).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMemoryText(memory: Memory) {
  return (
    memory.note_text?.trim() ||
    memory.caption?.trim() ||
    (memory.type === "photo"
      ? "Photo saved without a caption"
      : "Note saved without text")
  );
}
