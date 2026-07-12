import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ActivityIndicator, View } from "react-native";

import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function TabLayout() {
  const { bootstrapping, isAuthenticated } = useSession();
  const publicDiscoveryEnabled =
    process.env.EXPO_PUBLIC_ENABLE_PUBLIC_DISCOVERY === "true";

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

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      blurEffect="systemThinMaterial"
      backgroundColor={colors.canvas}
      tintColor={colors.accentStrong}
      iconColor={{
        default: colors.subtle,
        selected: colors.accentStrong,
      }}
      labelStyle={{
        fontFamily: fonts.body,
        fontSize: 11,
        fontWeight: "700",
      }}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="(library)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home" }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Icon
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
          md={{ default: "add_circle", selected: "add_circle" }}
        />
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {publicDiscoveryEnabled ? (
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Icon
            sf={{ default: "safari", selected: "safari.fill" }}
            md={{ default: "explore", selected: "explore" }}
          />
          <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ) : null}
    </NativeTabs>
  );
}
