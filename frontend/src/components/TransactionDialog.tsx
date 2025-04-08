import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { TransactionPayload } from "@/hooks/useWebSocket";
import smallLogo from "/src/assets/shielded_logo_small.png";
import { CheckCircle, XCircle } from "lucide-react";
import React from "react";

export function TransactionDialog({
  transactionPayload,
  onAccept,
  onReject,
  timeout = 30000,
}: {
  transactionPayload: TransactionPayload;
  onAccept: () => void;
  onReject: (message?: string) => void;
  timeout?: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / (timeout / 100);
      });
    }, 100);

    const timer = setTimeout(() => {
      onReject("User decision timed out");
    }, timeout);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onReject, timeout]);

  const formatArgValue = (arg: {
    value: string;
    type: string;
    label?: string;
  }) => {
    if (arg.value === null) return "Unknown";
    if (arg.type === "uint256")
      return (parseFloat(arg.value) / 1e18).toFixed(6);
    if (arg.type === "address" && arg.label)
      return (
        <>
          <b>{arg.label}</b>
          <br />
          {formatAddressAsLink(arg.value)}
        </>
      );
    return arg.value;
  };

  const formatAddressAsLink = (address: string) => {
    return <a href={`https://etherscan.io/address/${address}`}>{address}</a>;
  };

  return (
    <Card className="shadow-lg p-10 m-2 min-w-[800px] max-w-[900px]">
      <CardHeader className="flex flex-col items-center">
        <img
          src={smallLogo}
          alt="Web3 Pi Tx Firewall"
          className="mb-4 w-30 rounded-full border-2 border-white p-2"
        />
        <CardTitle className="text-xl font-bold text-center">
          Do you want to accept transaction ?
          <div className="text-sm text-muted-foreground mt-2">
            <Tooltip>
              <TooltipTrigger>
                {`${transactionPayload.id.slice(0, 16)}...${transactionPayload.id.slice(-16)}`}
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                {transactionPayload.id}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4 w-full text-left">
        <p className="text-lg font-semibold mb-6 border-b pb-2">
          Transaction details
        </p>
        <div className="grid grid-cols-[25%_75%] gap-y-2 text-base">
          <div className="font-semibold">From:</div>
          <div>
            <b>{transactionPayload.labelFrom || "Unknown"}</b>
            <br />
            {formatAddressAsLink(transactionPayload.from)}
          </div>
          <div className="font-semibold">To:</div>
          <div>
            <b>{transactionPayload.labelTo || "Unknown"}</b>
            <br />
            {formatAddressAsLink(transactionPayload.to)}
          </div>
          <div className="font-semibold">Value:</div>
          <div>
            <b>{(parseFloat(transactionPayload.value) / 1e18).toFixed(6)}</b>{" "}
            ETH
          </div>
          {transactionPayload.txType !== "transfer" && (
            <p className="col-span-2 text-lg font-semibold mt-6 mb-6 border-b">
              Data
            </p>
          )}

          {transactionPayload.contractInfo &&
          Object.keys(transactionPayload.contractInfo).length > 0 ? (
            <>
              <div className="font-semibold">Interacting with:</div>
              <div>
                <b>
                  {transactionPayload.contractInfo.labelAddress || "Unknown"}
                </b>
                <br />
                {formatAddressAsLink(transactionPayload.contractInfo.address)}
              </div>
              <div className="font-semibold">Function:</div>
              <div className="font-semibold">
                {transactionPayload.contractInfo.functionName
                  ? transactionPayload.contractInfo.functionName
                  : "Unknown"}
              </div>
              {transactionPayload.contractInfo.args &&
                transactionPayload.contractInfo.args.length > 0 && (
                  <>
                    <div className="font-semibold">Arguments:</div>
                    <div className="grid grid-cols-[18%_82%] gap-y-2">
                      {transactionPayload.contractInfo.args.map(
                        (arg, index) => (
                          <React.Fragment key={index}>
                            <div className="font-semibold">{arg.name}:</div>
                            <div>{formatArgValue(arg)}</div>
                          </React.Fragment>
                        ),
                      )}
                    </div>
                  </>
                )}
            </>
          ) : (
            transactionPayload.txType !== "transfer" && (
              <>
                <div></div>
                <div className="break-all">{transactionPayload.data}</div>
              </>
            )
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4 mt-6">
        <div className="w-full rounded-full h-2">
          <div
            className="bg-secondary h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-12 mt-6">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onReject("User rejected transaction")}
            className="px-10 py-6 text-xl"
          >
            <span className="flex items-center gap-2">
              <XCircle /> Reject
            </span>
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onAccept}
            className="px-10 py-6 text-xl"
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-10 h-10" /> Accept
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
