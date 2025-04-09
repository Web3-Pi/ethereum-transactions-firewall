import "./App.css";
import backgroundImage from "/src/assets/shielded_logo.png";
import { ConnectionAlert } from "@/components/ConnectionAllert.tsx";
import { TransactionDialog } from "@/components/TransactionDialog.tsx";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";

function App() {
  const websocketUrl =
    (window as Window & { __CONFIG?: { WS_URL?: string } }).__CONFIG?.WS_URL ||
    "ws://localhost:18501";

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
      {(status === "error" || status === "disconnected") && (
        <ConnectionAlert
          onRetryClick={handleRetryConnection}
          isOpen={isAlertOpen}
          onOpenChange={setIsAlertOpen}
        />
      )}
      {currentTransaction && isDialogOpen && (
        <TransactionDialog
          transactionPayload={currentTransaction}
          onAccept={handleAcceptTransaction}
          onReject={handleRejectTransaction}
        />
      )}
    </main>
  );
}

export default App;
