import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:font-sans group-[.toaster]:text-xs group-[.toaster]:rounded-none",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-mono group-[.toast]:text-[11px]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-mono group-[.toast]:text-xs group-[.toast]:rounded-none",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-mono group-[.toast]:text-xs group-[.toast]:rounded-none",
          error: "group-[.toaster]:border-destructive group-[.toaster]:text-destructive-foreground",
          success: "group-[.toaster]:border-emerald-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
