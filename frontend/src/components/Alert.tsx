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

interface AlertButton {
  label: string;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline";
}

interface AlertProps {
  title?: string;
  body?: string;
  icon?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttons?: AlertButton[];
  minWidth?: string;
  borderColor?: string;
}

export function Alert({
  title = "Connection Error",
  body = "Unable to establish a connection with the firewall.\nPlease check your firewall status.",
  icon = <TriangleAlert size={72} />,
  isOpen = false,
  onOpenChange,
  buttons = [
    { label: "Close", variant: "outline" },
    {
      label: "Try Again",
      onClick: () => {},
    },
  ],
  minWidth = "600px",
  borderColor = "border-secondary",
}: AlertProps) {
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
      <AlertDialogContent className={`min-w-[${minWidth}] p-10 ${borderColor}`}>
        <AlertDialogHeader>
          <div className="flex flex-col justify-center items-center gap-2 text-secondary">
            {icon}
            <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-lg mt-10 mb-10 text-white text-center whitespace-pre-line">
            {body}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-5">
          {buttons.map((button, index) =>
            button.variant === "outline" ? (
              <AlertDialogCancel key={index} onClick={button.onClick}>
                {button.label}
              </AlertDialogCancel>
            ) : (
              <AlertDialogAction key={index} onClick={button.onClick}>
                {button.label}
              </AlertDialogAction>
            ),
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
