import { View } from "react-native";

import { colors } from "@/lib/theme";

export function GatheredMark({ size = 36 }: { size?: number }) {
  const stroke = Math.max(2, Math.round(size * 0.075));
  const corner = Math.round(size * 0.3);
  const cornerRadius = Math.max(3, Math.round(corner * 0.42));
  const inset = Math.round(size * 0.08);
  const dot = Math.max(5, Math.round(size * 0.17));

  return (
    <View
      accessibilityLabel="Capsule"
      style={{ width: size, height: size, position: "relative" }}
    >
      <Corner color={colors.tomato} corner={corner} cornerRadius={cornerRadius} inset={inset} stroke={stroke} position="tl" />
      <Corner color={colors.blue} corner={corner} cornerRadius={cornerRadius} inset={inset} stroke={stroke} position="tr" />
      <Corner color={colors.olive} corner={corner} cornerRadius={cornerRadius} inset={inset} stroke={stroke} position="bl" />
      <Corner color={colors.gold} corner={corner} cornerRadius={cornerRadius} inset={inset} stroke={stroke} position="br" />
      <View
        style={{
          position: "absolute",
          left: (size - dot) / 2,
          top: (size - dot) / 2,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: colors.gold,
        }}
      />
    </View>
  );
}

function Corner({
  color,
  corner,
  cornerRadius,
  inset,
  stroke,
  position,
}: {
  color: string;
  corner: number;
  cornerRadius: number;
  inset: number;
  stroke: number;
  position: "tl" | "tr" | "bl" | "br";
}) {
  const top = position.startsWith("t") ? inset : undefined;
  const bottom = position.startsWith("b") ? inset : undefined;
  const left = position.endsWith("l") ? inset : undefined;
  const right = position.endsWith("r") ? inset : undefined;

  return (
    <View
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        width: corner,
        height: corner,
        borderColor: color,
        borderTopWidth: position.startsWith("t") ? stroke : 0,
        borderBottomWidth: position.startsWith("b") ? stroke : 0,
        borderLeftWidth: position.endsWith("l") ? stroke : 0,
        borderRightWidth: position.endsWith("r") ? stroke : 0,
        borderTopLeftRadius: position === "tl" ? cornerRadius : 0,
        borderTopRightRadius: position === "tr" ? cornerRadius : 0,
        borderBottomLeftRadius: position === "bl" ? cornerRadius : 0,
        borderBottomRightRadius: position === "br" ? cornerRadius : 0,
      }}
    />
  );
}
