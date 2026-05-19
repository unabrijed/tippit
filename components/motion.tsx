import { Children } from "react";
import { cn } from "@/lib/utils";

export function MotionSection({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={className}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="animate-enter motion-reduce:animate-none">{children}</div>
    </div>
  );
}

export function MotionStagger({
  children,
  className,
  staggerDelay = 0.1
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const items = Children.toArray(children);

  return (
    <div className={cn(className, "motion-reduce:[&>*]:animate-none")}>
      {items.length > 0
        ? items.map((child, index) => (
            <div key={index} className="animate-enter" style={{ animationDelay: `${index * staggerDelay}s` }}>
              {child}
            </div>
          ))
        : null}
    </div>
  );
}

export function MotionItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className, "animate-enter motion-reduce:animate-none")}>
      {children}
    </div>
  );
}
