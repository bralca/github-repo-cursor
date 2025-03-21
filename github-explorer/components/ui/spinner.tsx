import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

export function Spinner({ 
  className, 
  size = "default", 
  ...props 
}: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-transparent border-2",
        {
          "h-4 w-4 border-2": size === "sm",
          "h-6 w-6 border-2": size === "default",
          "h-8 w-8 border-3": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
} 