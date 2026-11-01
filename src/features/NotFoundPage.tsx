import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/states';
import { cn } from '@/lib/utils';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="Page not found"
        description="That screen does not exist in the POS app. Head back to checkout."
        action={
          <Link
            to="/sale"
            className={cn(
              buttonVariants(),
              'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
            )}
          >
            Back to sale
          </Link>
        }
      />
    </Card>
  );
}
