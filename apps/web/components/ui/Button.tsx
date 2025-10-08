import { ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

export default function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('btn-primary', className)} {...props} />;
}
