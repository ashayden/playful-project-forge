'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { ChevronRight } from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultCollapsed?: boolean;
}

export function Sidebar({
  className,
  defaultCollapsed = false,
  children,
  ...props
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <Collapsible
      defaultOpen={!defaultCollapsed}
      open={!isCollapsed}
      onOpenChange={(open: boolean) => setIsCollapsed(!open)}
      className={cn('h-full', className)}
      {...props}
    >
      <div className="flex h-full">
        <div
          className={cn(
            'relative flex h-full w-[250px] flex-col overflow-hidden border-r bg-background transition-all duration-300',
            isCollapsed && 'w-[50px]'
          )}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  !isCollapsed && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent
            forceMount
            className={cn(
              'flex h-full flex-col opacity-100 transition-all duration-300',
              isCollapsed && 'opacity-0'
            )}
          >
            <ScrollArea className="flex-1 p-4">{children}</ScrollArea>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
} 