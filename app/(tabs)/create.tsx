import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createCapsule,
  createMemory,
  readApiError,
  uploadMedia,
} from "@/lib/api";
import { AppTopBar } from "@/components/app-top-bar";
import { useSession } from "@/lib/session";
import {
  colors,
  fonts,
  inputStyle,
  radius,
  spacing,
  type,
} from "@/lib/theme";

export default function CreateCapsuleRoute() {
  const { token } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [initialPhoto, setInitialPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleReady = title.trim().length > 0;
  const canCreate = Boolean(token && titleReady && !creating);
  const previewSource = initialPhoto ? { uri: initialPhoto.uri } : null;

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark", true);
    }, []),
  );

  async function pickInitialPhoto() {
    setPickingPhoto(true);
    setError(null);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error("Photo library access is needed to add a cover.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.88,
      });

      if (!result.canceled && result.assets[0]) {
        setInitialPhoto(result.assets[0]);
      }
    } catch (caught) {
      setError(readApiError(caught));
    } finally {
      setPickingPhoto(false);
    }
  }

  async function handleCreateCapsule() {
    if (!token || !canCreate) {
      return;
    }

    setCreating(true);
    setError(null);

    let createdCapsuleId: string | null = null;

    try {
      const response = await createCapsule(token, {
        title: title.trim(),
        description: description.trim(),
        privacy: "private",
      });
      createdCapsuleId = response.data.id;

      if (initialPhoto) {
        const mediaResponse = await uploadMedia(token, response.data.id, {
          uri: initialPhoto.uri,
          name: initialPhoto.fileName ?? filenameFromUri(initialPhoto.uri),
          type: initialPhoto.mimeType ?? "image/jpeg",
        });

        await createMemory(token, response.data.id, {
          type: "photo",
          mediaId: mediaResponse.data.id,
        });
      }

      resetForm();
      router.push(`/capsules/${response.data.id}`);
    } catch (caught) {
      const message = readApiError(caught);

      if (createdCapsuleId) {
        resetForm();
        Alert.alert(
          "Capsule created",
          `The capsule is safe, but its first photo was not added. ${message}`,
        );
        router.replace(`/capsules/${createdCapsuleId}`);
      } else {
        setError(message);
      }
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setInitialPhoto(null);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xxl + 96,
        gap: spacing.xl,
      }}
    >
        <StatusBar style="dark" />

        <AppTopBar />

        <CreateTopBar
          canCreate={canCreate}
          creating={creating}
          onCreate={handleCreateCapsule}
        />

        <View style={{ alignItems: "center", gap: spacing.xs }}>
          <Text
            selectable
            style={[
              type.title,
              {
                fontSize: 39,
                lineHeight: 45,
                textAlign: "center",
              },
            ]}
          >
            New capsule
          </Text>
          <Text selectable style={[type.body, { textAlign: "center" }]}>
            A private home for a moment, place, or chapter.
          </Text>
        </View>

        <SelectedCoverObject
          source={previewSource}
          picking={pickingPhoto}
          usingPhoto={Boolean(initialPhoto)}
          onPress={pickInitialPhoto}
        />

        <View style={{ gap: spacing.md }}>
          <Field label="Title">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Winter cottage weekend"
              placeholderTextColor={colors.subtle as string}
              maxLength={140}
              returnKeyType="next"
              style={inputStyle}
            />
          </Field>

          <Field label="Context">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What belongs in this capsule?"
              placeholderTextColor={colors.subtle as string}
              maxLength={2000}
              multiline
              textAlignVertical="top"
              style={[
                inputStyle,
                {
                  minHeight: 112,
                  paddingTop: spacing.md,
                },
              ]}
            />
          </Field>
        </View>

        <View
          accessibilityLabel="Private capsule access"
          style={{
            borderRadius: radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.accentSoft,
            padding: spacing.md,
            gap: spacing.xxs,
          }}
        >
          <Text selectable style={type.label}>
            Private by default
          </Text>
          <Text selectable style={type.body}>
            Only people you invite can view or add to this capsule.
          </Text>
        </View>

      {error ? <ErrorBlock message={error} /> : null}
    </ScrollView>
  );
}

function CreateTopBar({
  canCreate,
  creating,
  onCreate,
}: {
  canCreate: boolean;
  creating: boolean;
  onCreate: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 44,
        gap: spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close create capsule"
        onPress={() => router.back()}
        style={({ pressed }) => ({
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          selectable={false}
          style={{
              color: colors.ink,
              fontFamily: fonts.body,
              fontSize: 22,
              lineHeight: 24,
            }}
          >
            {"<"}
          </Text>
        </Pressable>

      <Text
        selectable={false}
        style={{
          flex: 1,
          color: colors.ink,
          fontFamily: fonts.display,
          fontSize: 25,
          lineHeight: 30,
          textAlign: "center",
        }}
      >
        Capsule
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canCreate }}
        disabled={!canCreate}
        onPress={onCreate}
        style={({ pressed }) => ({
          minHeight: 42,
          minWidth: 78,
          alignItems: "flex-end",
          justifyContent: "center",
          opacity: !canCreate ? 0.36 : pressed ? 0.72 : 1,
        })}
      >
        {creating ? (
          <ActivityIndicator color={colors.accent as string} />
        ) : (
          <Text
            selectable={false}
            style={{
              color: colors.accent,
              fontFamily: fonts.body,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            Create
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function SelectedCoverObject({
  source,
  picking,
  usingPhoto,
  onPress,
}: {
  source: { uri: string } | null;
  picking: boolean;
  usingPhoto: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Choose cover photo"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 238,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.line,
        overflow: "hidden",
        backgroundColor: colors.surfaceMuted,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {source ? (
        <>
          <Image
            source={source}
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
              backgroundColor: "rgba(20, 17, 13, 0.12)",
            }}
          />
        </>
      ) : null}
      <View
        style={{
          position: "absolute",
          left: spacing.md,
          bottom: spacing.md,
          gap: spacing.xs,
        }}
      >
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: 14,
            backgroundColor: source
              ? "rgba(255, 253, 251, 0.88)"
              : colors.surface,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
          }}
        >
          <Text
            selectable={false}
            style={{
              color: colors.ink,
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: "700",
              lineHeight: 16,
            }}
          >
            Cover
          </Text>
        </View>
        <Text
          selectable={false}
          style={{
            color: source ? colors.white : colors.ink,
            fontFamily: fonts.display,
            fontSize: 30,
            lineHeight: 36,
            textShadowColor: source ? "rgba(0, 0, 0, 0.34)" : "transparent",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 8,
          }}
        >
          Choose the first image
        </Text>
      </View>
      <View
        style={{
          position: "absolute",
          right: spacing.md,
          top: spacing.md,
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.white,
          boxShadow: "0 8px 24px rgba(41, 32, 28, 0.14)",
        }}
      >
        {picking ? (
          <ActivityIndicator color={colors.ink as string} />
        ) : (
          <Text
            selectable={false}
            style={{
              color: colors.ink,
              fontFamily: fonts.body,
              fontSize: usingPhoto ? 15 : 22,
              fontWeight: "600",
              lineHeight: 20,
            }}
          >
            {usingPhoto ? "Edit" : "+"}
          </Text>
        )}
      </View>
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

function filenameFromUri(uri: string) {
  return uri.split("/").filter(Boolean).at(-1) ?? "capsule-photo.jpg";
}
