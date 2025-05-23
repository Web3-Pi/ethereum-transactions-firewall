import { useState, useEffect, useCallback, useRef } from "react";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface ContractArg {
  name: string;
  type: string;
  value: string;
  label?: string;
}

export interface ContractInfo {
  address: string;
  labelAddress?: string;
  functionName: string;
  args?: ContractArg[];
}
export type TransactionType =
  | "transfer"
  | "erc-20-transfer"
  | "contract-creation"
  | "contract-call"
  | "unknown";

export interface TransactionPayload {
  id: string;
  from: string;
  labelFrom?: string;
  to: string;
  labelTo?: string;
  value: string;
  txType: TransactionType;
  data: string;
  contractInfo?: ContractInfo;
  nonce?: string;
  gasLimit?: string;
  chainId?: string;
  networkName?: string;
  transactionType?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
}

export interface UserDecision {
  id: string;
  timestamp: number;
  result: boolean;
  message?: string;
}

export const useWebSocket = (url: string) => {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [currentTransaction, setCurrentTransaction] =
    useState<TransactionPayload | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setStatus("connecting");
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TransactionPayload;
          setCurrentTransaction(data);
        } catch (error) {
          console.error("Invalid message format:", error);
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };

      ws.onclose = () => {
        setStatus("disconnected");
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus("error");
      console.error("Error while connecting to WebSocket:", error);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setStatus("disconnected");
    }
  }, []);

  const sendMessage = useCallback((userDecision: UserDecision) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(userDecision));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    currentTransaction,
    connect,
    disconnect,
    sendMessage,
  };
};
