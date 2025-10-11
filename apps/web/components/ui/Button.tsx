import { ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };

export default function Button({ className, variant = 'primary', ...props }: Props) {
  const base = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  return <button className={cn(base, className)} {...props} />;
}
