const { WebSocketTxnQuery } = require("../common/connection/websocketxnquery");


class WebSocketTransactionValidator {

    constructor(wssPort) {
        this.wsc = new WebSocketTxnQuery(wssPort);
    }

    validateTransactionOnce(reqData, callbackAccepted, callbackRejected) {
        if (reqData.method !== 'eth_sendRawTransaction') {
            callbackAccepted();
        } else {
            this.wsc.queryAcceptTransaction(reqData.params[0], callbackAccepted, callbackRejected);
        }
    }
}

exports.WebSocketTransactionValidator = WebSocketTransactionValidator;
