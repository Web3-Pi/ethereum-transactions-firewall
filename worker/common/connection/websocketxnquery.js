const assert = require('assert');

const { BlockingWebSocket } = require('../blockingwebsocket');
const { RawTransactionDecoder } = require('../transactions/decoders');

const { UserSessionData } = require('../../session/usersessiondata');
const { TransactionPayload } = require('../transactions/transaction');

const WebSocketServer = require('ws');
const { currentDateStr } = require('../util/dateutil');


class WebSocketTxnQuery {

    constructor(endpointUrl, wssPort) {

        console.log(`${currentDateStr()}  Websocket server is running on port: ${wssPort}`);

        this.endpointUrl = endpointUrl;
        this.userSessionData = new UserSessionData(endpointUrl);

        this.curTxnId = 0;
        this.webSocket = new BlockingWebSocket(null);

        this.decoder = new RawTransactionDecoder(this.userSessionData);
        this.wss = new WebSocketServer.Server({port: wssPort});

        this.wss.on("connection", (ws) => {
            this.webSocket.updateWebSocket(ws);
        });
    }

    #getTxnPayloadString(id, rawTxn) {
        const txn = this.decoder.decodeTxn(rawTxn);
        const labelFrom = this.userSessionData.getLabel(txn.from);
        const labelTo = this.userSessionData.getLabel(txn.to);

        return new TransactionPayload(id, labelFrom, labelTo, txn).toString();
    }

    queryAcceptTransaction(rawTxn, callbackAccepted, callbackRejected) {
        if (!this.webSocket.isActive()){
            console.log(`${currentDateStr()} Websocket not connected -> ACCEPTING current transaction`);
            callbackAccepted()
        } else if (this.webSocket.isBusy()) {
            console.log(`${currentDateStr()} Websocket is busy processing a query -> ACCEPTING current transaction`);
            callbackAccepted()
        } else {
            const id = this.curTxnId++;
            this.webSocket.send(this.#getTxnPayloadString(id, rawTxn)).then(
                (result) => {
                    const res = JSON.parse(result);
                    assert(id == res.id);
                    res.status == 'accepted' ? callbackAccepted() : callbackRejected();
                }
            );
        }
    }

    reload() {
        this.userSessionData = new UserSessionData(this.endpointUrl);
        console.log(`${currentDateStr()}  User session data reloaded`);
    }
};

exports.WebSocketTxnQuery = WebSocketTxnQuery;
