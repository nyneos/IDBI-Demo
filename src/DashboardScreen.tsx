import { useUserNameLive } from '@/useUserNameLive';

export function DashboardScreen() {
  const userName = useUserNameLive();

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-content-primary">
        {userName ? `Hi, ${userName}` : 'Waiting for user_name…'}
      </h1>
    </div>
  );
}
