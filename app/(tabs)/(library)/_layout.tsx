import { Stack } from "expo-router/stack";

export const unstable_settings = {
  anchor: "index",
};

export default function LibraryLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
