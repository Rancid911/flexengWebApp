export type SettingsProfileDto = {
  userId: string;
  email: string;
  pendingEmail: string;
  cachedAvatarUrl: string | null;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
    role: string | null;
    email: string;
  };
  resolvedBirthDate: string;
};

export type SettingsProfileUpdateInput = {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  email: string;
  currentPassword: string;
  nextPassword: string;
  profileDirty: boolean;
  emailDirty: boolean;
  passwordDirty: boolean;
  avatarDelete: boolean;
  avatarFile: Blob | null;
};

export type SettingsProfileUpdateResult = {
  profile: SettingsProfileDto;
  applied: {
    profile: boolean;
    avatar: boolean;
    email: boolean;
    password: boolean;
  };
  avatarMessage: string;
  hasAppliedChanges: boolean;
  hasEmailPendingConfirmation: boolean;
};
