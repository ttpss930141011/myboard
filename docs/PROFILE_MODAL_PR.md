# Profile Modal Feature

## Overview
Adds a profile modal that displays user information when clicking the "Profile" option in the user menu.

## Changes
- Created `use-profile-modal` store for modal state management
- Added `ProfileModal` component with user information display
- Updated `UserMenu` to open profile modal instead of showing toast
- Added `ProfileModal` to `ModalProvider`

## UI Display
The modal shows:
- User avatar, name, and email
- Real member since date from database
- Connected accounts (Google/GitHub/Email) from auth providers
- Always shows "Just now" for last login (since user is currently logged in)

## Files Changed
- `store/use-profile-modal.ts` - New modal state store
- `components/modals/profile-modal.tsx` - New profile modal component
- `app/(dashboard)/_components/user-menu.tsx` - Updated to open modal
- `providers/modal-provider.tsx` - Added ProfileModal
- `auth.ts` - Added session callback to fetch user data
- `types/next-auth.d.ts` - Extended session types
- `components/ui/badge.tsx` - Added badge component for provider display

## Testing
1. Log in to the application
2. Click on your avatar in the top right
3. Click "Profile" in the dropdown
4. Verify the modal displays your user information correctly
5. Verify the modal can be closed