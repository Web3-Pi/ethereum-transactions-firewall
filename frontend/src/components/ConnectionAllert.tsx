import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface ConnectionAlertProps {
  onRetryClick?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConnectionAlert({
  onRetryClick,
  isOpen = false,
  onOpenChange,
}: ConnectionAlertProps) {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="min-w-[600px] p-10 border-secondary">
        <AlertDialogHeader>
          <div className="flex flex-col justify-center items-center gap-2 text-secondary">
            <TriangleAlert size={72} />
            <AlertDialogTitle className="text-xl">
              Connection Error
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-lg mt-10 mb-10 text-white text-center">
            Unable to establish a connection with the firewall.
            <br />
            Please check your firewall status.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-5">
          <AlertDialogCancel>Close</AlertDialogCancel>
          {onRetryClick && (
            <AlertDialogAction onClick={onRetryClick}>
              Try Again
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
