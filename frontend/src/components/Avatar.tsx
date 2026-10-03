import type { ApiUser } from '../api/client';
import clsx from 'clsx';

export function Avatar({
  user,
  size = 'sm',
}: {
  user: Pick<ApiUser, 'name' | 'avatarColor'>;
  size?: 'sm' | 'lg';
}) {
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={clsx('avatar', size === 'lg' && 'lg')}
      style={{ background: user.avatarColor || '#0f766e' }}
      title={user.name}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ users }: { users: Pick<ApiUser, 'id' | 'name' | 'avatarColor'>[] }) {
  return (
    <div className="avatar-stack">
      {users.slice(0, 4).map((u) => (
        <Avatar key={u.id} user={u} />
      ))}
    </div>
  );
}
