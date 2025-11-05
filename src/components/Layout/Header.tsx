import { Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  const { profile } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-gradient-primary border-b border-primary-200 dark:border-primary-800 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white dark:bg-primary-900 p-2 rounded-lg shadow-md">
            <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md">{title}</h1>
            <p className="text-sm text-white/90">{currentDate}</p>
          </div>
        </div>

        {profile && (
          <div className="flex items-center space-x-3 bg-white/20 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{profile.full_name}</p>
              <p className="text-xs text-white/80 capitalize">{profile.role}</p>
            </div>
            <div className="w-10 h-10 bg-white dark:bg-primary-900 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-primary-600 dark:text-primary-300 font-bold text-lg">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
