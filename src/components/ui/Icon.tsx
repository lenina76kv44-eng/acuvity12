'use client';
import Image from 'next/image';
import clsx from 'clsx';
import { ICONS } from '@/src/config/icons';

type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  alt?: string;
  className?: string;
};

export default function Icon({ name, size = 20, alt, className }: Props) {
  const src = ICONS[name];

  // nothing to render if key not found
  if (!src) return null;

  // simple fallback if Image fails (shows small green gradient)
  const onError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget as HTMLImageElement;
    el.style.display = 'none';
    const fallback = document.createElement('span');
    fallback.style.width = `${size}px`;
    fallback.style.height = `${size}px`;
    fallback.style.borderRadius = '8px';
    fallback.style.display = 'inline-block';
    fallback.style.background =
      'linear-gradient(180deg,#32ff7e,#00d36e)'; // зелёный градиент под бренд
    el.parentElement?.appendChild(fallback);
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt || name}
        width={size}
        height={size}
        unoptimized // <- ключевой флаг
        loading="lazy"
        onError={onError as any}
        className="drop-shadow-[0_0_10px_rgba(0,255,128,.25)]"
      />
    </span>
  );
}