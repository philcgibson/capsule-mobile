import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import {
  Link,
  Redirect,
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  type LayoutChangeEvent,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  formatMemoryByline,
  formatMemoryDate,
  formatMemoryText,
} from "@/components/memory-card";
import {
  type Capsule,
  type Invite,
  type Memory,
  createInvite,
  createMemory,
  deleteCapsule,
  listInvites,
  listMemories,
  readApiError,
  revokeInvite,
  showCapsule,
  updateCapsule,
  uploadMedia,
} from "@/lib/api";
import { formatCount, formatDateRange } from "@/lib/format";
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
import { AppTopBar } from "@/components/app-top-bar";

type DetailSection = "memory" | "invite" | "settings" | "memories";

export default function CapsuleDetailRoute() {
  const { capsuleId } = useLocalSearchParams<{ capsuleId?: string }>();
  const resolvedCapsuleId = readParam(capsuleId);
  const { bootstrapping, isAuthenticated, token } = useSession();
  const scrollRef = useRef<ScrollView>(null);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [noteText, setNoteText] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsLocation, setSettingsLocation] = useState("");
  const [settingsStartDate, setSettingsStartDate] = useState("");
  const [settingsEndDate, setSettingsEndDate] = useState("");
  const [settingsPrivacy, setSettingsPrivacy] =
    useState<Capsule["privacy"]>("private");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copyingInvite, setCopyingInvite] = useState(false);
  const [sharingInvite, setSharingInvite] = useState(false);
  const [openingInvite, setOpeningInvite] = useState(false);
  const [revokingInvite, setRevokingInvite] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingCapsule, setDeletingCapsule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sectionOffsets, setSectionOffsets] = useState<
    Partial<Record<DetailSection, number>>
  >({});

  const coverMemory = useMemo(
    () => memories.find((memory) => memory.media?.public_url) ?? null,
    [memories],
  );
  const coverUrl =
    capsule?.cover_media?.public_url ?? coverMemory?.media?.public_url ?? null;
  const photoCount = useMemo(
    () =>
      memories.filter((memory) => memory.media?.media_type === "image").length,
    [memories],
  );
  const canInviteGuests = capsule?.privacy === "private";
  const hasMemory = memories.length > 0;
  const nextAction = useMemo(
    () =>
      capsule
        ? detailNextAction({
            capsule,
            memories,
            invite,
            canInviteGuests: Boolean(canInviteGuests),
          })
        : null,
    [capsule, memories, invite, canInviteGuests],
  );
  const settingsChanged =
    capsule !== null &&
    (settingsTitle !== capsule.title ||
      settingsDescription !== (capsule.description ?? "") ||
      settingsLocation !== (capsule.location ?? "") ||
      settingsStartDate !== (capsule.start_date ?? "") ||
      settingsEndDate !== (capsule.end_date ?? "") ||
      settingsPrivacy !== capsule.privacy);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark", true);

      return () => {
        setStatusBarStyle("dark", true);
      };
    }, []),
  );

  useEffect(() => {
    if (!token || !resolvedCapsuleId) {
      setLoading(false);
      return;
    }

    const activeToken = token;
    const activeCapsuleId = resolvedCapsuleId;
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      setActionError(null);

      try {
        const snapshot = await fetchCapsuleSnapshot(
          activeToken,
          activeCapsuleId,
        );

        if (!cancelled) {
          applySnapshot(snapshot);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(readApiError(caught));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [resolvedCapsuleId, token]);

  useEffect(() => {
    if (!capsule) {
      return;
    }

    setSettingsTitle(capsule.title);
    setSettingsDescription(capsule.description ?? "");
    setSettingsLocation(capsule.location ?? "");
    setSettingsStartDate(capsule.start_date ?? "");
    setSettingsEndDate(capsule.end_date ?? "");
    setSettingsPrivacy(capsule.privacy);
  }, [
    capsule?.id,
    capsule?.title,
    capsule?.description,
    capsule?.location,
    capsule?.start_date,
    capsule?.end_date,
    capsule?.privacy,
  ]);

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

  function captureSection(section: DetailSection) {
    return (event: LayoutChangeEvent) => {
      const nextOffset = Math.max(event.nativeEvent.layout.y - spacing.sm, 0);

      setSectionOffsets((current) => {
        if (current[section] === nextOffset) {
          return current;
        }

        return { ...current, [section]: nextOffset };
      });
    };
  }

  function scrollToSection(section: DetailSection) {
    if (section === "settings") {
      setShowSettings(true);
    }

    scrollRef.current?.scrollTo({
      y: sectionOffsets[section] ?? 0,
      animated: true,
    });
  }

  async function fetchCapsuleSnapshot(
    nextToken: string,
    nextCapsuleId: string,
  ) {
    const [capsuleResponse, memoriesResponse, invitesResponse] =
      await Promise.all([
        showCapsule(nextToken, nextCapsuleId),
        listMemories(nextToken, nextCapsuleId),
        listInvites(nextToken, nextCapsuleId),
      ]);

    return {
      capsule: capsuleResponse.data,
      memories: memoriesResponse.data,
      invite:
        invitesResponse.data.find(
          (nextInvite) => nextInvite.status === "active",
        ) ?? null,
    };
  }

  function applySnapshot(snapshot: Awaited<ReturnType<typeof fetchCapsuleSnapshot>>) {
    setCapsule(snapshot.capsule);
    setMemories(snapshot.memories);
    setInvite(snapshot.invite);
  }

  async function refresh() {
    if (!token || !resolvedCapsuleId) {
      return;
    }

    setRefreshing(true);
    setError(null);
    setActionError(null);

    try {
      applySnapshot(await fetchCapsuleSnapshot(token, resolvedCapsuleId));
    } catch (caught) {
      setError(readApiError(caught));
    } finally {
      setRefreshing(false);
    }
  }

  async function submitNote() {
    if (!token || !resolvedCapsuleId || noteText.trim().length === 0) {
      return;
    }

    setCreatingNote(true);
    setActionError(null);
    setNotice(null);

    try {
      const response = await createMemory(token, resolvedCapsuleId, {
        noteText: noteText.trim(),
      });

      setMemories((current) => [response.data, ...current]);
      setCapsule((current) =>
        current
          ? {
              ...current,
              memories_count: (current.memories_count ?? memories.length) + 1,
            }
          : current,
      );
      setNoteText("");
      setNotice("Memory saved.");
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setCreatingNote(false);
    }
  }

  async function pickPhoto() {
    if (!token || !resolvedCapsuleId) {
      return;
    }

    setUploadingPhoto(true);
    setActionError(null);
    setNotice(null);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error("Photo library access is needed to add an image.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.88,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaResponse = await uploadMedia(token, resolvedCapsuleId, {
          uri: asset.uri,
          name: asset.fileName ?? filenameFromUri(asset.uri),
          type: asset.mimeType ?? "image/jpeg",
        });
        const memoryResponse = await createMemory(token, resolvedCapsuleId, {
          type: "photo",
          mediaId: mediaResponse.data.id,
          caption: photoCaption.trim() || undefined,
        });

        setMemories((current) => [memoryResponse.data, ...current]);
        setCapsule((current) =>
          current
            ? {
                ...current,
                memories_count: (current.memories_count ?? memories.length) + 1,
                cover_media_id: current.cover_media_id ?? mediaResponse.data.id,
                cover_media: current.cover_media ?? mediaResponse.data,
              }
            : current,
        );
        setPhotoCaption("");
        setNotice("Photo saved.");
      }
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function generateInvite() {
    if (!token || !resolvedCapsuleId) {
      return;
    }

    if (!canInviteGuests) {
      setActionError("Save this capsule as private before creating a guest link.");
      scrollToSection("settings");
      return;
    }

    if (!hasMemory) {
      setActionError("Add one memory before sending a guest link.");
      scrollToSection("memory");
      return;
    }

    setCreatingInvite(true);
    setActionError(null);
    setNotice(null);

    try {
      const response = await createInvite(token, resolvedCapsuleId);
      setInvite(response.data);
      setNotice("Guest link ready.");
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setCreatingInvite(false);
    }
  }

  async function copyInvite() {
    if (!invite?.invite_url) {
      return;
    }

    setCopyingInvite(true);
    setActionError(null);

    try {
      await Clipboard.setStringAsync(invite.invite_url);
      setNotice("Guest link copied.");
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setCopyingInvite(false);
    }
  }

  async function shareInvite() {
    if (!invite?.invite_url || !capsule) {
      return;
    }

    setSharingInvite(true);
    setActionError(null);

    try {
      await Share.share({
        title: `Contribute to ${capsule.title}`,
        message: `Add a photo or note to ${capsule.title}: ${invite.invite_url}`,
        url: invite.invite_url,
      });
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setSharingInvite(false);
    }
  }

  async function openInvite() {
    if (!invite?.invite_url) {
      return;
    }

    setOpeningInvite(true);
    setActionError(null);

    try {
      await Linking.openURL(invite.invite_url);
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setOpeningInvite(false);
    }
  }

  function confirmRevokeInvite() {
    if (!invite || revokingInvite) {
      return;
    }

    Alert.alert(
      "Revoke guest link?",
      "People with this link will no longer be able to add to this capsule.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Revoke", style: "destructive", onPress: revokeCurrentInvite },
      ],
    );
  }

  async function revokeCurrentInvite() {
    if (!token || !resolvedCapsuleId || !invite) {
      return;
    }

    setRevokingInvite(true);
    setActionError(null);
    setNotice(null);

    try {
      await revokeInvite(token, resolvedCapsuleId, invite.id);
      setInvite(null);
      setNotice("Guest link revoked.");
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setRevokingInvite(false);
    }
  }

  async function saveSettings() {
    if (!token || !resolvedCapsuleId || settingsTitle.trim().length === 0) {
      return;
    }

    setSavingSettings(true);
    setActionError(null);
    setNotice(null);

    try {
      const response = await updateCapsule(token, resolvedCapsuleId, {
        title: settingsTitle.trim(),
        description: settingsDescription.trim() || null,
        location: settingsLocation.trim() || null,
        startDate: settingsStartDate.trim() || null,
        endDate: settingsEndDate.trim() || null,
        privacy: settingsPrivacy,
      });

      setCapsule(response.data);
      setNotice("Capsule details saved.");
    } catch (caught) {
      setActionError(readApiError(caught));
    } finally {
      setSavingSettings(false);
    }
  }

  function confirmDeleteCapsule() {
    if (!capsule || deletingCapsule) {
      return;
    }

    Alert.alert(
      "Delete capsule?",
      `This permanently removes ${capsule.title}, its memories, guest links, and stored photos.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete capsule", style: "destructive", onPress: deleteCurrentCapsule },
      ],
    );
  }

  async function deleteCurrentCapsule() {
    if (!token || !resolvedCapsuleId) {
      return;
    }

    setDeletingCapsule(true);
    setActionError(null);

    try {
      await deleteCapsule(token, resolvedCapsuleId);
      router.replace("/");
    } catch (caught) {
      setActionError(readApiError(caught));
      setDeletingCapsule(false);
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.ink as string}
          colors={[colors.ink as string]}
        />
      }
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.xl,
      }}
    >
        <Stack.Screen
          options={{
            title: capsule?.title ?? "Capsule",
            headerShown: false,
          }}
        />
        <StatusBar style="dark" />

        <AppTopBar />

        {loading && !capsule ? <LoadingState /> : null}
        {error ? <ErrorBlock message={error} onRetry={refresh} /> : null}
        {actionError ? <NoticeBlock tone="danger" message={actionError} /> : null}
        {notice ? <NoticeBlock tone="success" message={notice} /> : null}

        {capsule ? (
          <>
            <CapsuleHero
              capsule={capsule}
              coverUrl={coverUrl}
            />

            <CapsuleSummaryPanel
              capsule={capsule}
              memoriesCount={memories.length}
              photoCount={photoCount}
              canInviteGuests={Boolean(canInviteGuests)}
              inviteReady={Boolean(invite?.invite_url)}
              onAddMemory={() => scrollToSection("memory")}
              onInvite={() => scrollToSection("invite")}
              onShare={() => {
                if (invite?.invite_url) {
                  void shareInvite();
                  return;
                }

                scrollToSection("invite");
              }}
            />

            <DetailSegmentBar
              onDetails={() => scrollToSection("settings")}
              onPeople={() => scrollToSection("invite")}
              onTimeline={() => scrollToSection("memories")}
            />

            <View onLayout={captureSection("memories")}>
              <MemoryPreview
                capsuleId={capsule.id}
                memories={memories}
                onAdd={() => scrollToSection("memory")}
              />
            </View>

            {nextAction ? (
              <InviteStatusStrip
                action={nextAction}
                inviteReady={Boolean(invite?.invite_url)}
                onPress={() => scrollToSection(nextAction.target)}
              />
            ) : null}

            <View
              onLayout={captureSection("memory")}
              style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}
            >
              <View style={{ gap: spacing.xs }}>
                <Text selectable style={type.sectionTitle}>
                  Add memory
                </Text>
                <Text selectable style={type.body}>
                  Add one note or one photo that makes the capsule more specific.
                </Text>
              </View>

              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="A detail that should not be lost."
                placeholderTextColor={colors.subtle as string}
                maxLength={10000}
                multiline
                textAlignVertical="top"
                style={[
                  inputStyle,
                  {
                    minHeight: 108,
                    paddingTop: spacing.md,
                  },
                ]}
              />
              <PrimaryButton
                label="Save note"
                loading={creatingNote}
                disabled={creatingNote || noteText.trim().length === 0}
                onPress={submitNote}
              />

              <View style={{ height: 1, backgroundColor: colors.line }} />

              <TextInput
                value={photoCaption}
                onChangeText={setPhotoCaption}
                placeholder="Caption for the next photo."
                placeholderTextColor={colors.subtle as string}
                maxLength={2000}
                style={inputStyle}
              />
              <SecondaryButton
                label="Choose photo"
                loading={uploadingPhoto}
                disabled={uploadingPhoto}
                onPress={pickPhoto}
              />
            </View>

          <View
            onLayout={captureSection("invite")}
            style={{
              ...cardStyle,
              padding: spacing.lg,
              gap: spacing.md,
              backgroundColor: colors.surface,
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <Text selectable style={type.sectionTitle}>
                Guest link
              </Text>
              <Text selectable style={type.body}>
                {hasMemory
                  ? "Share a browser link with someone who can add context."
                  : "Add one memory before sending an invite."}
              </Text>
            </View>

            <View style={{ gap: spacing.xs }}>
              <ReadinessRow complete={hasMemory} label="Has a starting memory" />
              <ReadinessRow
                complete={Boolean(canInviteGuests)}
                label={canInviteGuests ? "Private access is on" : "Save private access"}
              />
            </View>

            {!invite ? (
              <PrimaryButton
                label="Create guest link"
                loading={creatingInvite}
                disabled={creatingInvite || !hasMemory || !canInviteGuests}
                onPress={generateInvite}
              />
            ) : (
              <View style={{ gap: spacing.sm }}>
                <View
                  style={{
                    borderRadius: radius.md,
                    borderCurve: "continuous",
                    backgroundColor: colors.surfaceMuted,
                    padding: spacing.md,
                    gap: spacing.xs,
                  }}
                >
                  <Text selectable style={type.label}>Active guest link</Text>
                  <Text selectable numberOfLines={2} style={type.small}>
                    {invite.invite_url ??
                      `Link ending ${invite.token_preview ?? "is protected"}. Create a fresh link to share it again.`}
                  </Text>
                </View>
                {invite.invite_url ? (
                  <>
                    <View style={{ flexDirection: "row", gap: spacing.sm }}>
                      <SecondaryButton label="Copy" loading={copyingInvite} disabled={copyingInvite} onPress={copyInvite} />
                      <SecondaryButton label="Share" loading={sharingInvite} disabled={sharingInvite} onPress={shareInvite} />
                    </View>
                    <SecondaryButton label="Open" loading={openingInvite} disabled={openingInvite} onPress={openInvite} />
                  </>
                ) : (
                  <PrimaryButton
                    label="Create fresh link"
                    loading={creatingInvite}
                    disabled={creatingInvite || !hasMemory || !canInviteGuests}
                    onPress={generateInvite}
                  />
                )}
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <SecondaryButton
                    label="Revoke"
                    loading={revokingInvite}
                    disabled={revokingInvite}
                    danger
                    onPress={confirmRevokeInvite}
                  />
                </View>
              </View>
            )}
          </View>

          <View
            onLayout={captureSection("settings")}
            style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text selectable style={type.sectionTitle}>
                  Details
                </Text>
                <Text selectable style={type.body}>
                  Title, place, dates, and access.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowSettings((current) => !current)}
                style={({ pressed }) => ({
                  ...secondaryButtonStyle,
                  minHeight: 44,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <Text
                  selectable={false}
                  style={{
                    color: colors.ink,
                    fontFamily: fonts.body,
                    fontWeight: "600",
                  }}
                >
                  {showSettings ? "Close" : "Edit"}
                </Text>
              </Pressable>
            </View>

            {showSettings ? (
              <View style={{ gap: spacing.md }}>
                <TextInput
                  value={settingsTitle}
                  onChangeText={setSettingsTitle}
                  placeholder="Capsule title"
                  placeholderTextColor={colors.subtle as string}
                  maxLength={140}
                  style={inputStyle}
                />
                <TextInput
                  value={settingsDescription}
                  onChangeText={setSettingsDescription}
                  placeholder="Context"
                  placeholderTextColor={colors.subtle as string}
                  maxLength={2000}
                  multiline
                  textAlignVertical="top"
                  style={[inputStyle, { minHeight: 104, paddingTop: spacing.md }]}
                />
                <TextInput
                  value={settingsLocation}
                  onChangeText={setSettingsLocation}
                  placeholder="Place"
                  placeholderTextColor={colors.subtle as string}
                  maxLength={160}
                  style={inputStyle}
                />
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <TextInput
                    value={settingsStartDate}
                    onChangeText={setSettingsStartDate}
                    placeholder="2026-01-01"
                    placeholderTextColor={colors.subtle as string}
                    style={[inputStyle, { flex: 1 }]}
                  />
                  <TextInput
                    value={settingsEndDate}
                    onChangeText={setSettingsEndDate}
                    placeholder="2026-01-03"
                    placeholderTextColor={colors.subtle as string}
                    style={[inputStyle, { flex: 1 }]}
                  />
                </View>
                <PrivacyChoice
                  label="Private — invited people only"
                  selected={settingsPrivacy === "private"}
                  onPress={() => setSettingsPrivacy("private")}
                />
                <PrimaryButton
                  label="Save details"
                  loading={savingSettings}
                  disabled={
                    savingSettings ||
                    !settingsChanged ||
                    settingsTitle.trim().length === 0
                  }
                  onPress={saveSettings}
                />
              </View>
            ) : null}
            <View style={{ height: 1, backgroundColor: colors.line }} />
            <SecondaryButton
              label="Delete capsule"
              loading={deletingCapsule}
              disabled={deletingCapsule}
              danger
              onPress={confirmDeleteCapsule}
            />
          </View>
          </>
        ) : null}
    </ScrollView>
  );
}

function CapsuleHero({
  capsule,
  coverUrl,
}: {
  capsule: Capsule;
  coverUrl: string | null;
}) {
  const meta = [
    capsule.location?.trim(),
    formatDateRange(capsule.start_date, capsule.end_date),
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <View
      style={{
        height: 418,
        marginHorizontal: -spacing.lg,
        marginTop: -spacing.lg,
        overflow: "hidden",
        backgroundColor: colors.surfaceStrong,
      }}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          resizeMode="cover"
          style={
            isReferenceCoverUrl(coverUrl)
              ? {
                  position: "absolute",
                  top: -418 * 1.08,
                  left: 0,
                  width: "100%",
                  height: 418 * 2.42,
                }
              : { width: "100%", height: "100%" }
          }
        />
      ) : (
        <CoverPlaceholder title={capsule.title} />
      )}

      <View
        style={{
          position: "absolute",
          top: 66,
          left: spacing.lg,
          right: spacing.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 3,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to library"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 253, 249, 0.86)",
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <Text
            selectable={false}
            style={{
              color: colors.ink,
              fontFamily: fonts.body,
              fontSize: 26,
              lineHeight: 28,
            }}
          >
            {"<"}
          </Text>
        </Pressable>

      </View>

      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(18, 15, 12, 0.24)",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          left: 0,
          height: 210,
          backgroundColor: "rgba(18, 15, 12, 0.35)",
        }}
      />

      <View
        style={{
          position: "absolute",
          right: spacing.lg,
          bottom: 132,
          left: spacing.lg,
          alignItems: "center",
          gap: spacing.xs,
        }}
      >
        <Text
          selectable
          numberOfLines={2}
          style={{
            color: colors.white,
            fontFamily: fonts.display,
            fontSize: 38,
            lineHeight: 44,
            textAlign: "center",
            textShadowColor: "rgba(0, 0, 0, 0.45)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 10,
          }}
        >
          {capsule.title}
        </Text>
        <Text
          selectable
          numberOfLines={1}
          style={{
            color: "rgba(255, 253, 251, 0.88)",
            fontFamily: fonts.body,
            fontSize: 14,
            fontWeight: "600",
            lineHeight: 19,
            textAlign: "center",
          }}
        >
          {meta}
        </Text>
      </View>
    </View>
  );
}

function CapsuleSummaryPanel({
  capsule,
  memoriesCount,
  photoCount,
  canInviteGuests,
  inviteReady,
  onAddMemory,
  onInvite,
  onShare,
}: {
  capsule: Capsule;
  memoriesCount: number;
  photoCount: number;
  canInviteGuests: boolean;
  inviteReady: boolean;
  onAddMemory: () => void;
  onInvite: () => void;
  onShare: () => void;
}) {
  return (
    <View
      style={{
        ...cardStyle,
        marginTop: -112,
        padding: spacing.md,
        gap: spacing.md,
        backgroundColor: colors.surface,
        boxShadow: "0 18px 42px rgba(41, 32, 28, 0.12)",
        zIndex: 2,
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <SummaryStat label="moments" value={String(memoriesCount)} />
        <SummaryStat
          label="people"
          value={String(capsule.contributors_count ?? 0)}
        />
        <SummaryStat label="photos" value={String(photoCount)} />
      </View>

      {capsule.description ? (
        <Text selectable style={type.body}>
          {capsule.description}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <SummaryAction label="Memory" mark="+" onPress={onAddMemory} />
        <SummaryAction
          label={canInviteGuests ? "Guest link" : "Access"}
          mark={inviteReady ? "v" : "+"}
          onPress={onInvite}
        />
        <SummaryAction label="Share" mark="^" onPress={onShare} />
      </View>
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 62,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xxs,
      }}
    >
      <Text
        selectable
        numberOfLines={1}
        style={{
          color: colors.ink,
          fontFamily: fonts.display,
          fontSize: value.length > 3 ? 20 : 26,
          lineHeight: 30,
        }}
      >
        {value}
      </Text>
      <Text selectable numberOfLines={1} style={type.small}>
        {label}
      </Text>
    </View>
  );
}

function SummaryAction({
  label,
  mark,
  onPress,
}: {
  label: string;
  mark: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 54,
        borderRadius: radius.md,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surfaceInset,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xxs,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text
        selectable={false}
        style={{
          color: colors.accent,
          fontFamily: fonts.body,
          fontSize: 17,
          fontWeight: "700",
          lineHeight: 18,
        }}
      >
        {mark}
      </Text>
      <Text
        selectable={false}
        numberOfLines={1}
        style={{
          color: colors.ink,
          fontFamily: fonts.body,
          fontSize: 12,
          fontWeight: "700",
          lineHeight: 15,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DetailSegmentBar({
  onDetails,
  onPeople,
  onTimeline,
}: {
  onDetails: () => void;
  onPeople: () => void;
  onTimeline: () => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        borderRadius: radius.lg,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surfaceInset,
        flexDirection: "row",
        padding: spacing.xxs,
        gap: spacing.xxs,
      }}
    >
      <SegmentButton label="Timeline" selected onPress={onTimeline} />
      <SegmentButton label="Details" onPress={onDetails} />
      <SegmentButton label="People" onPress={onPeople} />
    </View>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 42,
        borderRadius: radius.md,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? colors.surface : "transparent",
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text
        selectable={false}
        style={{
          color: selected ? colors.ink : colors.muted,
          fontFamily: selected ? "Georgia" : "Avenir Next",
          fontSize: selected ? 17 : 13,
          fontWeight: selected ? "400" : "600",
          lineHeight: 20,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CapsuleHeader({
  capsule,
  memoriesCount,
  photoCount,
}: {
  capsule: Capsule;
  memoriesCount: number;
  photoCount: number;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text selectable style={type.title}>
          {capsule.title}
        </Text>
        <Text selectable style={type.body}>
          {capsule.location?.trim() || "No place set"} /{" "}
          {formatDateRange(capsule.start_date, capsule.end_date)}
        </Text>
      </View>

      {capsule.description ? (
        <Text selectable style={type.body}>
          {capsule.description}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <StatItem label="Memories" value={String(memoriesCount)} />
        <StatItem
          label="Access"
          value="Private"
        />
        <StatItem label="Photos" value={String(photoCount)} />
      </View>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 68,
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: colors.surfaceInset,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xxs,
      }}
    >
      <Text
        selectable
        numberOfLines={1}
        style={{
          color: colors.ink,
          fontFamily: fonts.display,
          fontSize: value.length > 3 ? 18 : 25,
          lineHeight: 28,
        }}
      >
        {value}
      </Text>
      <Text selectable numberOfLines={1} style={type.small}>
        {label}
      </Text>
    </View>
  );
}

function ActionDock({
  onAddMemory,
  onInvite,
  onShare,
}: {
  onAddMemory: () => void;
  onInvite: () => void;
  onShare: () => void;
}) {
  return (
    <View
      style={{
        ...cardStyle,
        minHeight: 70,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        overflow: "hidden",
      }}
    >
      <DockButton label="Add memory" symbol="+" onPress={onAddMemory} />
      <DockDivider />
      <DockButton label="Invite" symbol="+" onPress={onInvite} />
      <DockDivider />
      <DockButton label="Share" symbol="^" onPress={onShare} />
    </View>
  );
}

function DockButton({
  label,
  symbol,
  onPress,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 68,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xxs,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text
        selectable={false}
        style={{
          color: colors.accent,
          fontFamily: fonts.body,
          fontSize: 22,
          fontWeight: "500",
          lineHeight: 23,
        }}
      >
        {symbol}
      </Text>
      <Text
        selectable={false}
        style={{
          color: colors.ink,
          fontFamily: fonts.body,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DockDivider() {
  return (
    <View
      style={{
        width: 1,
        height: 34,
        backgroundColor: colors.line,
      }}
    />
  );
}

function MemoryPreview({
  capsuleId,
  memories,
  onAdd,
}: {
  capsuleId: string;
  memories: Memory[];
  onAdd: () => void;
}) {
  const previewMemories = memories;

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Text selectable style={type.sectionTitle}>
          Timeline
        </Text>
        <Text selectable style={type.small}>
          {formatCount(memories.length, "saved")}
        </Text>
      </View>

      {previewMemories.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
          }}
        >
          {previewMemories.map((memory) => (
            <CompactMemoryRow
              key={memory.id}
              capsuleId={capsuleId}
              memory={memory}
            />
          ))}
        </View>
      ) : (
        <EmptyMemories onAdd={onAdd} />
      )}
    </View>
  );
}

function CompactMemoryRow({
  capsuleId,
  memory,
}: {
  capsuleId: string;
  memory: Memory;
}) {
  const imageUrl = memory.media?.public_url ?? null;

  return (
    <Link href={`/capsules/${capsuleId}/memories/${memory.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open memory"
        style={({ pressed }) => ({
          ...cardStyle,
          width: "48.2%",
          minHeight: 212,
          overflow: "hidden",
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            resizeMode="cover"
            style={{
              width: "100%",
              height: 118,
              backgroundColor: colors.surfaceMuted,
            }}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 118,
              backgroundColor: colors.surfaceStrong,
              justifyContent: "center",
              padding: spacing.sm,
            }}
          >
            <Text
              selectable={false}
              numberOfLines={4}
              style={{
                color: colors.white,
                fontFamily: fonts.display,
                fontSize: 17,
                lineHeight: 22,
              }}
            >
              {formatMemoryText(memory)}
            </Text>
          </View>
        )}

        <View
          style={{
            minWidth: 0,
            padding: spacing.sm,
            gap: spacing.xs,
          }}
        >
          <Text selectable numberOfLines={1} style={type.small}>
            {formatMemoryDate(memory)}
          </Text>
          <Text
            selectable
            numberOfLines={3}
            style={{
              color: colors.ink,
              fontFamily: fonts.display,
              fontSize: 18,
              lineHeight: 23,
            }}
          >
            {formatMemoryText(memory)}
          </Text>
          <Text selectable numberOfLines={1} style={[type.small, { fontSize: 11 }]}>
            {formatMemoryByline(memory)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function InviteStatusStrip({
  action,
  inviteReady,
  onPress,
}: {
  action: ReturnType<typeof detailNextAction>;
  inviteReady: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        ...cardStyle,
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: inviteReady ? colors.mossSoft : colors.surfaceInset,
        }}
      >
        <Text
          selectable={false}
          style={{
            color: inviteReady ? colors.moss : colors.accent,
            fontFamily: fonts.body,
            fontWeight: "700",
          }}
        >
          {inviteReady ? "v" : "!"}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: spacing.xxs }}>
        <Text selectable numberOfLines={1} style={type.label}>
          {inviteReady ? "Invite ready" : action.title}
        </Text>
        <Text selectable numberOfLines={2} style={type.small}>
          {inviteReady ? "Anyone with the link can add memories." : action.copy}
        </Text>
      </View>

      <Text selectable={false} style={[type.body, { color: colors.subtle }]}>
        {">"}
      </Text>
    </Pressable>
  );
}

function isReferenceCoverUrl(value: string) {
  return value.toLocaleLowerCase().includes("/capsules/demo/reference-");
}

function ReadinessRow({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <View
      style={{
        minHeight: 44,
        borderRadius: radius.md,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: complete ? colors.mossSoft : colors.line,
        backgroundColor: complete ? colors.mossSoft : colors.surface,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: complete ? colors.moss : colors.subtle,
        }}
      />
      <Text
        selectable
        style={{
          color: complete ? colors.moss : colors.muted,
          fontFamily: fonts.body,
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function PrivacyChoice({
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
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        borderRadius: radius.md,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: selected ? colors.ink : colors.line,
        backgroundColor: selected ? colors.ink : colors.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <Text
        selectable={false}
        style={{
          color: selected ? colors.white : colors.muted,
          fontFamily: fonts.body,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        ...primaryButtonStyle,
        backgroundColor: disabled ? colors.lineStrong : colors.ink,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.white as string} />
      ) : (
        <Text
          selectable={false}
          style={{
            color: colors.white,
            fontFamily: fonts.body,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function SecondaryButton({
  label,
  loading,
  disabled,
  danger,
  onPress,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        ...secondaryButtonStyle,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={(danger ? colors.danger : colors.ink) as string} />
      ) : (
        <Text
          selectable={false}
          style={{
            color: danger ? colors.danger : colors.ink,
            fontFamily: fonts.body,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function CoverPlaceholder({ title }: { title: string }) {
  const letter = title.trim().charAt(0).toUpperCase() || "C";

  return (
    <View
      style={{
        aspectRatio: 1.04,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceMuted,
      }}
    >
      <Text
        selectable={false}
        style={{
          color: colors.moss,
          fontFamily: fonts.display,
          fontSize: 72,
          lineHeight: 78,
        }}
      >
        {letter}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.sm }}>
      <ActivityIndicator color={colors.ink as string} />
      <Text selectable style={{ ...type.body, textAlign: "center" }}>
        Opening this capsule.
      </Text>
    </View>
  );
}

function EmptyMemories({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ ...cardStyle, padding: spacing.lg, gap: spacing.md }}>
      <Text selectable style={type.sectionTitle}>
        No memories yet.
      </Text>
      <Text selectable style={type.body}>
        Add one note or photo before sending the guest link. It gives the
        capsule a clear tone.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={({ pressed }) => ({
          ...primaryButtonStyle,
          alignSelf: "flex-start",
          minHeight: 46,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <Text
          selectable={false}
          style={{
            color: colors.white,
            fontFamily: fonts.body,
            fontWeight: "600",
          }}
        >
          Add memory
        </Text>
      </Pressable>
    </View>
  );
}

function NoticeBlock({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "danger";
}) {
  const danger = tone === "danger";

  return (
    <View
      style={{
        borderRadius: radius.md,
        borderCurve: "continuous",
        backgroundColor: danger ? colors.dangerSoft : colors.mossSoft,
        padding: spacing.md,
      }}
    >
      <Text
        selectable
        style={{
          color: danger ? colors.danger : colors.moss,
          fontFamily: fonts.body,
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
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
        borderRadius: radius.md,
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
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <Text
          selectable={false}
          style={{
            color: colors.ink,
            fontFamily: fonts.body,
            fontWeight: "600",
          }}
        >
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function filenameFromUri(uri: string) {
  return uri.split("/").filter(Boolean).at(-1) ?? "capsule-photo.jpg";
}

function detailNextAction({
  capsule,
  memories,
  invite,
  canInviteGuests,
}: {
  capsule: Capsule;
  memories: Memory[];
  invite: Invite | null;
  canInviteGuests: boolean;
}) {
  if (memories.length === 0) {
    return {
      title: "Add the first memory",
      copy: "One detail gives the capsule its tone before anyone else contributes.",
      cta: "Add memory",
      target: "memory" as const,
    };
  }

  if (canInviteGuests && !invite) {
    return {
      title: "Invite one contributor",
      copy: "The capsule has a starting point. Share it with someone who can add context.",
      cta: "Create link",
      target: "invite" as const,
    };
  }

  if (!canInviteGuests) {
    return {
      title: "Finish private access",
      copy: `Save ${capsule.title} as private before sharing a guest link.`,
      cta: "Review access",
      target: "settings" as const,
    };
  }

  return {
    title: "Review what belongs",
    copy: "Keep the capsule selective: useful memories, clear context, no clutter.",
    cta: "Review memories",
    target: "memories" as const,
  };
}
