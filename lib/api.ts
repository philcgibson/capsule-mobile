import { NativeModules } from 'react-native';

export type Capsule = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  cover_media_id: string | null;
  cover_media?: Media | null;
  start_date: string | null;
  end_date: string | null;
  privacy: 'private' | 'public';
  is_public: boolean;
  status: 'draft' | 'active' | 'archived';
  memories_count?: number;
  contributors_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type PublicCapsule = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  cover_media?: Media | null;
  start_date: string | null;
  end_date: string | null;
  memories_count?: number;
  contributors_count?: number;
  join_status: 'available' | 'joined' | 'owner';
  can_join: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type Memory = {
  id: string;
  capsule_id: string;
  user_id: number | null;
  contributor_id: string | null;
  media_id: string | null;
  type: 'photo' | 'note';
  caption: string | null;
  note_text: string | null;
  taken_at: string | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  media?: Media | null;
  contributor?: Contributor | null;
};

export type Contributor = {
  id: string;
  capsule_id: string;
  guest_name: string | null;
  guest_email: string | null;
  user_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Media = {
  id: string;
  capsule_id: string | null;
  memory_id: string | null;
  public_url: string | null;
  mime_type: string;
  media_type: 'image';
  size_bytes: number;
  width: number | null;
  height: number | null;
  crop_x: number;
  crop_y: number;
  crop_zoom: number;
  duration_seconds: number | null;
  status: 'pending' | 'uploaded' | 'processing' | 'ready' | 'failed';
  created_at: string | null;
  updated_at: string | null;
};

export type Invite = {
  id: string;
  capsule_id: string;
  token_preview: string | null;
  token?: string;
  invite_url?: string;
  scope: 'contribute' | 'view' | 'view_and_contribute';
  status: 'active' | 'revoked' | 'expired';
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
};

type ApiEnvelope<T> = {
  data: T;
};

export type AuthToken = {
  token: string;
  token_type: 'Bearer';
  expires_at: string;
  user: CurrentUser;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function readApiError(caught: unknown) {
  if (caught instanceof ApiError) {
    const firstValidationError = Object.values(caught.errors ?? {})[0]?.[0];

    if (firstValidationError) {
      return firstValidationError;
    }

    if (caught.status === 0) {
      if (__DEV__) {
        return `Capsule could not reach the server at ${apiBaseUrl}. Check that the backend is running and reachable from this device.`;
      }

      return 'Capsule could not reach the server. Check your connection and try again.';
    }

    if (caught.status === 401 || caught.status === 419) {
      return 'Your Capsule session needs refreshing. Pull to refresh and try again.';
    }

    if (caught.status === 404) {
      return 'Capsule could not find that item. Refresh and try again.';
    }

    if (caught.status >= 500) {
      return 'Capsule hit a server problem. Try again in a moment.';
    }

    return caught.message || 'Capsule could not complete that request.';
  }

  if (caught instanceof Error) {
    return caught.message;
  }

  return 'Something went wrong. Try again.';
}

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!configuredApiBaseUrl && !__DEV__) {
  throw new Error('EXPO_PUBLIC_API_URL is required for production builds.');
}

export const apiBaseUrl = resolveDevelopmentBaseUrl(configuredApiBaseUrl);
export const webBaseUrl =
  resolveDevelopmentBaseUrl(
    process.env.EXPO_PUBLIC_WEB_URL ??
      apiBaseUrl.replace(/\/api\/v\d+\/?$/, ''),
  );

export async function getTestUserToken() {
  return requestJson<ApiEnvelope<AuthToken>>('/auth/test-user', {
    method: 'POST',
  });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  deviceName?: string;
}) {
  return requestJson<ApiEnvelope<AuthToken>>('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
      device_name: input.deviceName ?? 'Capsule Mobile',
    }),
  });
}

export async function login(input: {
  email: string;
  password: string;
  deviceName?: string;
}) {
  return requestJson<ApiEnvelope<AuthToken>>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      device_name: input.deviceName ?? 'Capsule Mobile',
    }),
  });
}

export async function logout(token: string) {
  await requestJson<null>('/auth/logout', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function deleteAccount(token: string, password: string) {
  await requestJson<null>('/auth/account', {
    method: 'DELETE',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
}

export async function getCurrentUser(token: string) {
  return requestJson<ApiEnvelope<CurrentUser>>('/user', {
    headers: authHeaders(token),
  });
}

export async function listCapsules(token: string) {
  return requestJson<ApiEnvelope<Capsule[]>>('/capsules', {
    headers: authHeaders(token),
  });
}

export async function listPublicCapsules(token: string) {
  return requestJson<ApiEnvelope<PublicCapsule[]>>('/public-capsules', {
    headers: authHeaders(token),
  });
}

export async function joinPublicCapsule(token: string, capsuleId: string) {
  return requestJson<ApiEnvelope<PublicCapsule>>(
    `/public-capsules/${capsuleId}/join`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
}

export async function showCapsule(token: string, capsuleId: string) {
  return requestJson<ApiEnvelope<Capsule>>(`/capsules/${capsuleId}`, {
    headers: authHeaders(token),
  });
}

export async function createCapsule(
  token: string,
  input: {
    title: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    privacy?: Capsule['privacy'];
  },
) {
  return requestJson<ApiEnvelope<Capsule>>('/capsules', {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      privacy: input.privacy ?? 'private',
    }),
  });
}

export async function updateCapsule(
  token: string,
  capsuleId: string,
  input: {
    title?: string;
    description?: string | null;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    privacy?: Capsule['privacy'];
  },
) {
  const body: Record<string, string | null> = {};

  if (input.title !== undefined) {
    body.title = input.title;
  }

  if (input.description !== undefined) {
    body.description = input.description;
  }

  if (input.location !== undefined) {
    body.location = input.location;
  }

  if (input.startDate !== undefined) {
    body.start_date = input.startDate;
  }

  if (input.endDate !== undefined) {
    body.end_date = input.endDate;
  }

  if (input.privacy !== undefined) {
    body.privacy = input.privacy;
  }

  return requestJson<ApiEnvelope<Capsule>>(`/capsules/${capsuleId}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function deleteCapsule(token: string, capsuleId: string) {
  await requestJson<null>(`/capsules/${capsuleId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function listMemories(token: string, capsuleId: string) {
  return requestJson<ApiEnvelope<Memory[]>>(`/capsules/${capsuleId}/memories`, {
    headers: authHeaders(token),
  });
}

export async function showMemory(
  token: string,
  capsuleId: string,
  memoryId: string,
) {
  return requestJson<ApiEnvelope<Memory>>(
    `/capsules/${capsuleId}/memories/${memoryId}`,
    {
      headers: authHeaders(token),
    },
  );
}

export async function createMemory(
  token: string,
  capsuleId: string,
  input: {
    noteText?: string;
    caption?: string;
    mediaId?: string;
    type?: 'photo' | 'note';
  },
) {
  return requestJson<ApiEnvelope<Memory>>(`/capsules/${capsuleId}/memories`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: input.type ?? (input.mediaId ? 'photo' : 'note'),
      note_text: input.noteText || null,
      caption: input.caption || null,
      media_id: input.mediaId || null,
    }),
  });
}

export async function deleteMemory(
  token: string,
  capsuleId: string,
  memoryId: string,
) {
  await requestJson<null>(`/capsules/${capsuleId}/memories/${memoryId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function uploadMedia(
  token: string,
  capsuleId: string,
  file: {
    uri: string;
    name: string;
    type: string;
  },
) {
  const formData = new FormData();

  formData.append('file', file as unknown as Blob);

  return requestJson<ApiEnvelope<Media>>(`/capsules/${capsuleId}/media`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
}

export async function listInvites(token: string, capsuleId: string) {
  const response = await requestJson<ApiEnvelope<Invite[]>>(
    `/capsules/${capsuleId}/invites`,
    {
      headers: authHeaders(token),
    },
  );

  return {
    ...response,
    data: response.data.map(normalizeInvite),
  };
}

export async function createInvite(token: string, capsuleId: string) {
  const response = await requestJson<ApiEnvelope<Invite>>(
    `/capsules/${capsuleId}/invites`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: 'view_and_contribute',
      }),
    },
  );

  return {
    ...response,
    data: normalizeInvite(response.data),
  };
}

export async function revokeInvite(
  token: string,
  capsuleId: string,
  inviteId: string,
) {
  await requestJson<null>(`/capsules/${capsuleId}/invites/${inviteId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

function normalizeInvite(invite: Invite): Invite {
  if (!invite.invite_url) {
    return invite;
  }

  return {
    ...invite,
    invite_url: normalizeWebUrl(invite.invite_url),
  };
}

function normalizeWebUrl(url: string) {
  try {
    const parsedInviteUrl = new URL(url);
    const parsedWebBaseUrl = new URL(webBaseUrl);

    parsedInviteUrl.protocol = parsedWebBaseUrl.protocol;
    parsedInviteUrl.host = parsedWebBaseUrl.host;

    return parsedInviteUrl.toString();
  } catch {
    return url;
  }
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function requestJson<T>(path: string, options: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0,
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.errors,
    );
  }

  return payload as T;
}

function resolveDevelopmentBaseUrl(configuredUrl: string) {
  if (!__DEV__) {
    return configuredUrl;
  }

  try {
    const parsedUrl = new URL(configuredUrl);

    if (!isLoopbackHost(parsedUrl.hostname)) {
      return configuredUrl;
    }

    const developmentHost = getDevelopmentHost();

    if (!developmentHost || isLoopbackHost(developmentHost)) {
      return configuredUrl;
    }

    parsedUrl.hostname = developmentHost;

    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return configuredUrl;
  }
}

function getDevelopmentHost() {
  const sourceCode = NativeModules.SourceCode as
    | { scriptURL?: string }
    | undefined;
  const scriptUrl = sourceCode?.scriptURL;

  if (!scriptUrl) {
    return null;
  }

  try {
    return new URL(scriptUrl).hostname;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
