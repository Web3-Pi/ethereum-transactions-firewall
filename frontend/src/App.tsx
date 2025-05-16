import "./App.css";
import backgroundImage from "/src/assets/shielded_logo.png";
import { Alert } from "@/components/Alert";
import { TransactionDialog } from "@/components/TransactionDialog.tsx";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";

type AppConfig = {
  WS_URL?: string;
  FIREWALL_MODE?: "interactive" | "non-interactive";
  INTERACTIVE_MODE_TIMEOUT_SEC?: number;
};

function App() {
  const appConfig = (window as Window & { __CONFIG?: AppConfig }).__CONFIG;
  const websocketUrl = appConfig?.WS_URL || "ws://localhost:18501";
  const interactiveModeTimeoutSec =
    appConfig?.INTERACTIVE_MODE_TIMEOUT_SEC || 30;
  const firewallMode = appConfig?.FIREWALL_MODE || "non-interactive";

  const { status, currentTransaction, connect, sendMessage } =
    useWebSocket(websocketUrl);
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(true);

  useEffect(() => {
    if (status === "error" || status === "disconnected") {
      setIsAlertOpen(true);
    } else {
      setIsAlertOpen(false);
    }
  }, [status]);

  useEffect(() => {
    if (currentTransaction) {
      setIsDialogOpen(true);
    }
  }, [currentTransaction]);

  const handleAcceptTransaction = () => {
    if (currentTransaction) {
      sendMessage({
        result: true,
        id: currentTransaction.id,
        timestamp: new Date().getTime(),
      });
      setIsDialogOpen(false);
    }
  };

  const handleRejectTransaction = (message?: string) => {
    if (currentTransaction)
      sendMessage({
        result: false,
        id: currentTransaction.id,
        timestamp: new Date().getTime(),
        message,
      });
    setIsDialogOpen(false);
  };

  const handleRetryConnection = () => {
    connect();
  };

  return (
    <main
      className="min-h-screen w-screen max-w-none bg-contain bg-center bg-no-repeat m-0 p-16 flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${backgroundImage}), radial-gradient(#1f0D36, #000000)`,
      }}
    >
      {firewallMode === "non-interactive" ? (
        <Alert
          isOpen={isAlertOpen}
          onOpenChange={setIsAlertOpen}
          title={"Non-interactive mode"}
          body={
            "Firewall is set to non-interactive mode. This means all transactions will be automatically accepted or rejected based on predefined rules without user intervention."
          }
          buttons={[]}
        />
      ) : (
        <>
          {(status === "error" || status === "disconnected") && (
            <Alert
              isOpen={isAlertOpen}
              onOpenChange={setIsAlertOpen}
              buttons={[
                { label: "Close", variant: "outline" },
                { label: "Try Again", onClick: handleRetryConnection },
              ]}
            />
          )}
          {currentTransaction && isDialogOpen && (
            <TransactionDialog
              transactionPayload={currentTransaction}
              onAccept={handleAcceptTransaction}
              onReject={handleRejectTransaction}
              timeout={interactiveModeTimeoutSec * 1000}
            />
          )}
        </>
      )}
    </main>
  );
}

export default App;
