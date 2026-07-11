import { Redirect, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { readApiError } from "@/lib/api";
import { GatheredMark } from "@/components/gathered-mark";
import { useSession } from "@/lib/session";
import {
  colors,
  fonts,
  inputStyle,
  primaryButtonStyle,
  radius,
  secondaryButtonStyle,
  spacing,
  type,
} from "@/lib/theme";

const lifeGatheredHero = require("../assets/marketing/life-gathered-hero.png");

type AuthMode = "login" | "register";

export default function AuthRoute() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { bootstrapping, isAuthenticated, signIn, signUp, useDemoSession } =
    useSession();
  const showDemoOwner =
    __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEMO_OWNER === "true";
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [autoDemoStarted, setAutoDemoStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroHeight = Math.min(410, Math.max(350, Math.round(height * 0.46)));
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === "login" ||
      (name.trim().length > 0 && passwordConfirmation.length > 0));

  useEffect(() => {
    if (
      demo !== "1" ||
      !showDemoOwner ||
      bootstrapping ||
      isAuthenticated ||
      autoDemoStarted
    ) {
      return;
    }

    setAutoDemoStarted(true);
    void handleDemo();
  }, [autoDemoStarted, bootstrapping, demo, isAuthenticated, showDemoOwner]);

  if (!bootstrapping && isAuthenticated) {
    return <Redirect href="/" />;
  }

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

  async function handleSubmit() {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        await signIn({
          email: email.trim(),
          password,
        });
      } else {
        await signUp({
          name: name.trim(),
          email: email.trim(),
          password,
          passwordConfirmation,
        });
      }

      router.replace("/");
    } catch (caught) {
      setError(readApiError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    setError(null);

    try {
      await useDemoSession();
      router.replace("/");
    } catch (caught) {
      setError(readApiError(caught));
    } finally {
      setDemoLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <StatusBar style="light" />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <AcquisitionHero height={heroHeight} topInset={insets.top} />

        <View
          style={{
            width: "100%",
            maxWidth: 620,
            alignSelf: "center",
            backgroundColor: colors.canvas,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl,
            gap: spacing.xl,
          }}
        >
          <View style={{ gap: spacing.xs }}>
            <Text
              selectable
              style={[type.eyebrow, { color: colors.accentStrong }]}
            >
              {mode === "login" ? "WELCOME BACK" : "BEGIN YOUR ARCHIVE"}
            </Text>
            <Text selectable style={type.sectionTitle}>
              {mode === "login" ? "Return to your capsules" : "Create your account"}
            </Text>
          </View>

          <View style={{ gap: spacing.lg }}>
            <View
              accessibilityRole="tablist"
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <ModeButton
                label="Sign in"
                selected={mode === "login"}
                onPress={() => changeMode("login")}
              />
              <ModeButton
                label="Create account"
                selected={mode === "register"}
                onPress={() => changeMode("register")}
              />
            </View>

            <View style={{ gap: spacing.md }}>
              {mode === "register" ? (
                <Field label="Name">
                  <TextInput
                    accessibilityLabel="Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Ada Lovelace"
                    placeholderTextColor={colors.subtle as string}
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    style={inputStyle}
                  />
                </Field>
              ) : null}

              <Field label="Email">
                <TextInput
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.subtle as string}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  style={inputStyle}
                />
              </Field>

              <Field label="Password">
                <TextInput
                  accessibilityLabel="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.subtle as string}
                  autoCapitalize="none"
                  autoComplete={mode === "login" ? "current-password" : "password"}
                  textContentType={mode === "login" ? "password" : "newPassword"}
                  secureTextEntry
                  returnKeyType={mode === "login" ? "done" : "next"}
                  onSubmitEditing={mode === "login" ? handleSubmit : undefined}
                  style={inputStyle}
                />
              </Field>

              {mode === "register" ? (
                <Field label="Confirm password">
                  <TextInput
                    accessibilityLabel="Confirm password"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    placeholder="Repeat password"
                    placeholderTextColor={colors.subtle as string}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="newPassword"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    style={inputStyle}
                  />
                </Field>
              ) : null}
            </View>

            {error ? <ErrorBlock message={error} /> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit || submitting }}
              disabled={!canSubmit || submitting}
              onPress={handleSubmit}
              style={({ pressed }) => ({
                ...primaryButtonStyle,
                backgroundColor:
                  !canSubmit || submitting ? colors.lineStrong : colors.espresso,
                opacity: pressed ? 0.84 : 1,
              })}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white as string} />
              ) : (
                <ButtonText light>
                  {mode === "login" ? "Continue" : "Create account"}
                </ButtonText>
              )}
            </Pressable>

            {showDemoOwner ? (
              <View style={{ gap: spacing.xs }}>
                <Text selectable style={[type.small, { textAlign: "center" }]}>
                  Local review only
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={demoLoading}
                  onPress={handleDemo}
                  style={({ pressed }) => ({
                    ...secondaryButtonStyle,
                    opacity: pressed ? 0.82 : 1,
                  })}
                >
                  {demoLoading ? (
                    <ActivityIndicator color={colors.ink as string} />
                  ) : (
                    <ButtonText>Use demo owner</ButtonText>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AcquisitionHero({
  height,
  topInset,
}: {
  height: number;
  topInset: number;
}) {
  return (
    <View
      style={{
        height,
        overflow: "hidden",
        backgroundColor: colors.surfaceStrong,
      }}
    >
      <Image
        accessible
        accessibilityLabel="Friends of different generations laughing together over an outdoor lunch"
        source={lifeGatheredHero}
        resizeMode="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(24, 22, 17, 0.35)",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          left: 0,
          height: Math.min(250, height * 0.68),
          backgroundColor: "rgba(24, 22, 17, 0.48)",
        }}
      />

      <View
        style={{
          position: "absolute",
          top: topInset + spacing.sm,
          right: spacing.lg,
          left: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              padding: 3,
              borderRadius: radius.md,
              backgroundColor: "rgba(255, 251, 244, 0.9)",
            }}
          >
            <GatheredMark size={32} />
          </View>
          <Text
            selectable={false}
            style={{
              color: colors.white,
              fontFamily: fonts.body,
              fontSize: 22,
              lineHeight: 27,
              fontWeight: "600",
              letterSpacing: -0.7,
            }}
          >
            Capsule
          </Text>
        </View>

        <Text
          selectable={false}
          style={{
            color: "rgba(255, 253, 247, 0.86)",
            fontFamily: fonts.body,
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          PRIVATE BY DEFAULT
        </Text>
      </View>

      <View
        style={{
          position: "absolute",
          right: spacing.lg,
          bottom: spacing.xl,
          left: spacing.lg,
          maxWidth: 540,
          gap: spacing.sm,
        }}
      >
        <Text
          selectable
          style={{
            color: "rgba(255, 253, 247, 0.88)",
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.2,
          }}
        >
          LIFE, GATHERED.
        </Text>
        <Text
          selectable
          style={{
            color: colors.white,
            fontFamily: fonts.display,
            fontSize: 38,
            lineHeight: 43,
            textShadowColor: "rgba(0, 0, 0, 0.34)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 8,
          }}
        >
          A place for the moments you’re still making.
        </Text>
        <Text
          selectable
          style={{
            maxWidth: 470,
            color: "rgba(255, 253, 247, 0.9)",
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Gather photos, notes, and the small details that make a life feel
          like yours — privately, together, and over time.
        </Text>
      </View>
    </View>
  );
}

function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 2,
        borderBottomColor: selected ? colors.accentStrong : "transparent",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text
        selectable={false}
        style={{
          color: selected ? colors.ink : colors.muted,
          fontFamily: fonts.body,
          fontSize: 14,
          fontWeight: selected ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={type.label}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function ButtonText({
  children,
  light,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Text
      selectable={false}
      style={{
        color: light ? colors.white : colors.ink,
        fontFamily: fonts.body,
        fontSize: 15,
        fontWeight: "700",
      }}
    >
      {children}
    </Text>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <View
      style={{
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: colors.dangerSoft,
        padding: spacing.sm,
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
