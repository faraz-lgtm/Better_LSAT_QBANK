/** Broadcasts profile photo updates so the shell header can stay in sync with Account. */

export const PROFILE_AVATAR_CHANGED_EVENT = "betterlsat.profile-avatar-changed"

export type ProfileAvatarChangedDetail = {
  avatarUrl: string | null
}

export function notifyProfileAvatarChanged(avatarUrl: string | null): void {
  window.dispatchEvent(
    new CustomEvent<ProfileAvatarChangedDetail>(PROFILE_AVATAR_CHANGED_EVENT, {
      detail: { avatarUrl },
    }),
  )
}

export function subscribeProfileAvatarChanged(
  onChange: (avatarUrl: string | null) => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ProfileAvatarChangedDetail>).detail
    onChange(detail?.avatarUrl?.trim() || null)
  }
  window.addEventListener(PROFILE_AVATAR_CHANGED_EVENT, handler)
  return () => window.removeEventListener(PROFILE_AVATAR_CHANGED_EVENT, handler)
}
