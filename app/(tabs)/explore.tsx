import { Redirect } from "expo-router";

import ExploreHome from "@/components/explore-home";

export default function ExploreRoute() {
  if (process.env.EXPO_PUBLIC_ENABLE_PUBLIC_DISCOVERY !== "true") {
    return <Redirect href="/" />;
  }

  return <ExploreHome />;
}
