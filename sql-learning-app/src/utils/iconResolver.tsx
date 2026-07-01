/**
 * アイコン名(Lucideのコンポーネント名文字列)を受け取り、React要素を返す。
 * GuideArticle・Home のカードなど複数箇所で使う共通ロジック。
 */
import * as LucideIcons from 'lucide-react';
import { BookOpen } from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
}

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

export function resolveIcon(iconName: string, props: IconProps = {}): React.ReactNode {
  const { size = 20, className = '' } = props;
  const icons = LucideIcons as unknown as Record<string, IconComponent>;
  const LucideIcon = icons[iconName];
  if (LucideIcon) {
    return <LucideIcon size={size} className={className} />;
  }
  return <BookOpen size={size} className={className} />;
}
