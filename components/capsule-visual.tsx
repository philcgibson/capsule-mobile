import { Image, Text, View } from "react-native";

import { GatheredMark } from "@/components/gathered-mark";
import { colors, fonts, spacing } from "@/lib/theme";

export type CapsuleVisualTone = "moss" | "clay" | "ochre" | "ink";

type CapsuleVisualProps = {
  title: string;
  imageUrl?: string | null;
  height?: number;
  tone?: CapsuleVisualTone;
  meta?: string;
  showTitle?: boolean;
  compact?: boolean;
};

export function CapsuleVisual({
  title,
  imageUrl,
  height = 164,
  meta,
  showTitle = false,
  compact = false,
}: CapsuleVisualProps) {
  const titleSize = compact ? 17 : Math.min(27, Math.max(20, height * 0.092));
  const titleLineHeight = compact ? 21 : titleSize + 5;
  const metaSize = compact ? 11 : 12;
  const bakedArtwork = imageUrl ? isBakedReferenceArtwork(imageUrl) : false;

  return (
    <View
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        backgroundColor: colors.surfaceMuted,
      }}
    >
      {imageUrl ? (
        <ImageCover
          bakedArtwork={bakedArtwork}
          height={height}
          imageUrl={imageUrl}
          meta={meta}
          metaSize={metaSize}
          showTitle={showTitle}
          title={title}
          titleLineHeight={titleLineHeight}
          titleSize={titleSize}
        />
      ) : (
        <EmptyCover
          compact={compact}
          height={height}
          meta={meta}
          metaSize={metaSize}
          showTitle={showTitle}
          title={title}
          titleLineHeight={titleLineHeight}
          titleSize={titleSize}
        />
      )}
    </View>
  );
}

function ImageCover({
  bakedArtwork,
  height,
  imageUrl,
  meta,
  metaSize,
  showTitle,
  title,
  titleLineHeight,
  titleSize,
}: {
  bakedArtwork: boolean;
  height: number;
  imageUrl: string;
  meta?: string;
  metaSize: number;
  showTitle: boolean;
  title: string;
  titleLineHeight: number;
  titleSize: number;
}) {
  if (bakedArtwork) {
    const cropAsPhoto = !showTitle;

    return (
      <Image
        source={{ uri: imageUrl }}
        resizeMode="cover"
        style={
          cropAsPhoto
            ? {
                position: "absolute",
                top: -height * 1.08,
                left: 0,
                width: "100%",
                height: height * 2.42,
              }
            : { width: "100%", height: "100%" }
        }
      />
    );
  }

  return (
    <>
      <Image
        source={{ uri: imageUrl }}
        resizeMode="cover"
        style={{ width: "100%", height: "100%" }}
      />
      {showTitle ? (
        <>
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(20, 17, 13, 0.22)",
            }}
          />
          <CoverTitle
            color={colors.white}
            meta={meta}
            metaSize={metaSize}
            shadow
            title={title}
            titleLineHeight={titleLineHeight}
            titleSize={titleSize}
          />
        </>
      ) : null}
    </>
  );
}

function EmptyCover({
  compact,
  height,
  meta,
  metaSize,
  showTitle,
  title,
  titleLineHeight,
  titleSize,
}: {
  compact: boolean;
  height: number;
  meta?: string;
  metaSize: number;
  showTitle: boolean;
  title: string;
  titleLineHeight: number;
  titleSize: number;
}) {
  const markSize = compact ? 30 : Math.min(48, Math.max(34, height * 0.18));

  return (
    <View
      accessibilityLabel={`No cover image for ${title}`}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: showTitle ? "flex-start" : "center",
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        paddingTop: showTitle ? spacing.xl : 0,
      }}
    >
      <GatheredMark size={markSize} />
      {!showTitle ? (
        <Text
          selectable={false}
          style={{
            color: colors.muted,
            fontFamily: fonts.body,
            fontSize: compact ? 10 : 11,
            lineHeight: 15,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          No cover yet
        </Text>
      ) : (
        <CoverTitle
          color={colors.ink}
          meta={meta}
          metaColor={colors.muted}
          metaSize={metaSize}
          title={title}
          titleLineHeight={titleLineHeight}
          titleSize={titleSize}
        />
      )}
    </View>
  );
}

function CoverTitle({
  color,
  meta,
  metaColor,
  metaSize,
  shadow,
  title,
  titleLineHeight,
  titleSize,
}: {
  color: string;
  meta?: string;
  metaColor?: string;
  metaSize: number;
  shadow?: boolean;
  title: string;
  titleLineHeight: number;
  titleSize: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        right: spacing.md,
        bottom: spacing.md,
        left: spacing.md,
        gap: spacing.xxs,
      }}
    >
      <Text
        selectable={false}
        numberOfLines={3}
        style={{
          color,
          fontFamily: fonts.display,
          fontSize: titleSize,
          lineHeight: titleLineHeight,
          textShadowColor: shadow ? "rgba(0, 0, 0, 0.38)" : "transparent",
          textShadowOffset: shadow ? { width: 0, height: 1 } : { width: 0, height: 0 },
          textShadowRadius: shadow ? 8 : 0,
        }}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          selectable={false}
          numberOfLines={1}
          style={{
            color: metaColor ?? color,
            fontFamily: fonts.body,
            fontSize: metaSize,
            fontWeight: "600",
            opacity: 0.92,
            textShadowColor: shadow ? "rgba(0, 0, 0, 0.28)" : "transparent",
            textShadowOffset: shadow ? { width: 0, height: 1 } : { width: 0, height: 0 },
            textShadowRadius: shadow ? 7 : 0,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

function isBakedReferenceArtwork(imageUrl: string) {
  return imageUrl.toLocaleLowerCase().includes("/capsules/demo/reference-");
}
