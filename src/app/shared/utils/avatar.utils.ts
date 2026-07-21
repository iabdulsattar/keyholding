export function getUserAvatar(user: any, fallback = '/images/user/dummy-user.png'): string {
  if (!user) return fallback;
  return user.avatar || user.avatarUrl || user.profileImageUrl || user.image || fallback;
}

export function getInitials(user: any): string {
  if (!user) return 'U';
  const first = (user.firstName || '').charAt(0);
  const last = (user.lastName || '').charAt(0);
  return (first + last).toUpperCase() || 'U';
}
