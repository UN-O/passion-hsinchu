import type { ComponentType, ReactNode } from "react"

export type ProfileCardProps = {
  avatarUrl?: string
  iconUrl?: string
  grainUrl?: string
  innerGradient?: string
  behindGlowEnabled?: boolean
  behindGlowColor?: string
  behindGlowSize?: string
  className?: string
  enableTilt?: boolean
  enableMobileTilt?: boolean
  mobileTiltSensitivity?: number
  miniAvatarUrl?: string
  name?: string
  title?: ReactNode
  handle?: string
  status?: string
  contactText?: string
  showUserInfo?: boolean
  onContactClick?: () => void
}

declare const ProfileCard: ComponentType<ProfileCardProps>
export default ProfileCard
