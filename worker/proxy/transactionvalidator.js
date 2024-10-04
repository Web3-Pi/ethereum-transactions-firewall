const { WebSocketTxnQuery } = require("../common/connection/websocketxnquery");


class WebSocketTransactionValidator {

    constructor(endpointUrl, wssPort) {
        this.wsc = new WebSocketTxnQuery(endpointUrl, wssPort);
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
