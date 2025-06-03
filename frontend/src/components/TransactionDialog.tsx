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
import { formatEther, formatUnits } from "ethers";

export function TransactionDialog({
  transactionPayload,
  onAccept,
  onReject,
  timeout,
}: {
  transactionPayload: TransactionPayload;
  onAccept: () => void;
  onReject: (message?: string) => void;
  timeout: number;
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
    if (arg.type === "uint256") return formatEther(arg.value);
    if (arg.type === "address")
      return (
        <>
          <b>{arg.label || "unknown"}</b>
          <br />
          {formatAddressAsLink(arg.value)}
        </>
      );
    return arg.value;
  };

  const formatAddressAsLink = (address: string) => {
    return (
      <a
        href={`https://etherscan.io/address/${address}`}
        className="hover:underline"
      >
        {address}
      </a>
    );
  };

  const displayBigIntValue = (
    value: bigint | string | number | undefined | null,
  ) => {
    if (value === undefined || value === null) return "N/A";
    return value.toString();
  };

  return (
    <Card className="shadow-lg p-10 m-2 min-w-[800px] max-w-[900px]">
      <CardHeader className="flex flex-col items-center">
        <img
          src={smallLogo}
          alt="Web3 Pi Tx Firewall"
          className="mb-3 w-24 rounded-full border border-white p-1.5"
        />
        <CardTitle className="text-lg font-bold text-center mt-1.5">
          Do you want to accept transaction?
          <div className="text-sm text-muted-foreground mt-1.5">
            <Tooltip>
              <TooltipTrigger>
                {`${transactionPayload.id.slice(0, 14)}...${transactionPayload.id.slice(-14)}`}
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                {transactionPayload.id}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-3 w-full text-left text-sm">
        <p className="text-base font-semibold mb-4 border-b pb-1.5">
          Transaction details
        </p>
        <div className="grid grid-cols-[25%_75%] gap-y-1.5 text-sm">
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
            <b>{formatEther(transactionPayload.value)}</b> ETH
          </div>
          <div className="font-semibold">Network:</div>
          <div>
            {transactionPayload.networkName && transactionPayload.chainId ? (
              <>
                <b>{transactionPayload.networkName}</b> (ID:{" "}
                {displayBigIntValue(transactionPayload.chainId)})
              </>
            ) : (
              displayBigIntValue(transactionPayload.chainId) || "N/A"
            )}
          </div>
          <div className="font-semibold">Nonce:</div>
          <div>
            <b>{displayBigIntValue(transactionPayload.nonce)}</b>
          </div>
          <div className="font-semibold">Gas Limit:</div>
          <div>
            <b>{displayBigIntValue(transactionPayload.gasLimit)}</b>
          </div>
          {transactionPayload.maxFeePerGas && (
            <>
              <div className="font-semibold">Max Fee Per Gas:</div>
              <div>
                <b>
                  {formatUnits(
                    transactionPayload.maxFeePerGas.toString(),
                    "gwei",
                  )}
                </b>{" "}
                Gwei
                {transactionPayload.avgFeePerGas &&
                  Number(
                    formatUnits(
                      transactionPayload.maxFeePerGas.toString(),
                      "gwei",
                    ),
                  ) <
                    Number(
                      formatUnits(
                        transactionPayload.avgFeePerGas?.toString() || "0",
                        "gwei",
                      ),
                    ) *
                      1.1 && (
                    <span className="text-red-500 ml-2">
                      Max fee per gas is high!
                    </span>
                  )}
              </div>
            </>
          )}
          {transactionPayload.maxPriorityFeePerGas && (
            <>
              <div className="font-semibold">Max Priority Fee:</div>
              <div>
                <b>
                  {formatUnits(
                    transactionPayload.maxPriorityFeePerGas.toString(),
                    "gwei",
                  )}
                </b>{" "}
                Gwei
              </div>
            </>
          )}
          {transactionPayload.gasPrice && !transactionPayload.maxFeePerGas && (
            <>
              <div className="font-semibold">Gas Price:</div>
              <div>
                <b>
                  {formatUnits(transactionPayload.gasPrice.toString(), "gwei")}
                </b>{" "}
                Gwei
                {transactionPayload.avgGasPrice &&
                  Number(
                    formatUnits(transactionPayload.gasPrice.toString(), "gwei"),
                  ) >
                    Number(
                      formatUnits(
                        transactionPayload.avgGasPrice?.toString() || "0",
                        "gwei",
                      ),
                    ) *
                      1.1 && (
                    <span className="text-red-500 ml-2">
                      Gas price is high!
                    </span>
                  )}
              </div>
            </>
          )}
          {transactionPayload.transactionType && (
            <>
              <div className="font-semibold">Transaction Type:</div>
              <div>
                <b>{transactionPayload.transactionType}</b>
              </div>
            </>
          )}
          {transactionPayload.txType !== "transfer" && (
            <p className="col-span-2 text-base font-semibold mt-4 mb-3 border-b pb-1">
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
                    <div className="grid grid-cols-[22%_78%] gap-y-1.5">
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
                <div className="break-all overflow-hidden text-ellipsis">
                  {transactionPayload.data || "N/A"}
                </div>
              </>
            )
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-3 mt-4">
        <div className="w-full flex items-center gap-2.5">
          <div className="w-full rounded-full h-2 bg-primary">
            <div
              className="bg-secondary h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold w-10 text-center">
            {timeout / 1000 - Math.floor((progress / 100) * (timeout / 1000))}s
          </span>
        </div>
        <div className="flex gap-8 mt-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onReject("User rejected transaction")}
            className="px-7 py-4 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> Reject
            </span>
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onAccept}
            className="px-7 py-4 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5" /> Accept
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
