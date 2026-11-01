import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn('relative', className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input ref={ref} className="h-9 pl-9" {...props} />
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
