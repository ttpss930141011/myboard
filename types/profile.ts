// Profile feature type definitions
// Following Single Responsibility Principle - each interface has one purpose

export interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: Date
  lastLoginAt?: Date
}

export interface ConnectedAccount {
  provider: 'google' | 'github' | 'email'
  email?: string
  connectedAt: Date
  lastUsedAt?: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'es' | 'fr' | 'zh' | 'ja'
  defaultBoardPrivacy: 'public' | 'private'
  emailNotifications: boolean
}

export interface ProfileStats {
  totalBoards: number
  favoriteBoards: number
  storageUsed: number // in bytes
  lastActiveAt: Date
}

// Service interfaces following Dependency Inversion Principle
export interface ProfileService {
  getProfile(): Promise<UserProfile>
  updateProfile(data: Partial<UserProfile>): Promise<UserProfile>
  uploadAvatar(file: File): Promise<string>
}

export interface PreferencesService {
  getPreferences(): Promise<UserPreferences>
  updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences>
}

export interface AccountService {
  getConnectedAccounts(): Promise<ConnectedAccount[]>
  disconnectAccount(provider: string): Promise<void>
}

// Props interfaces for components
export interface ProfilePageProps {
  profileService: ProfileService
  preferencesService: PreferencesService
  accountService: AccountService
}

export interface ProfileHeaderProps {
  user: UserProfile
  onAvatarClick?: () => void
}

export interface PreferencesSectionProps {
  preferences: UserPreferences
  onPreferenceChange: (key: keyof UserPreferences, value: any) => void
}