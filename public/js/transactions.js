import { appendAlert } from "./alerts.js";

export class TxnAcceptor {
    constructor(ws, result) {
        this.ws = ws;
        this.result = result;
    }

    #acceptMsg() {
        return "accepted"
    }

    #rejectMsg() {
        return "rejected"
    }

    #timeout() {
        return this.result.timeout;
    }

    #txnId() {
        return this.result.txnId;
    }

    #alertType(status) {
        return status === this.#acceptMsg() ? "success" : "danger";
    }

    #getReplyData(status) {
        return JSON.stringify({
            'id': this.#txnId(),
            'status': status
        });
    }

    #sendReply(status) {
        this.ws.send(this.#getReplyData(status));
    }

    #handlePageState(status) {
        clearTimeout(this.#timeout());
        appendAlert(`Transaction ${this.#txnId()} ${status}`, this.#alertType(status));
    }

    handleTxnReply(status) {
        this.#handlePageState(status);
        this.#sendReply(status);
    }

    getAcceptTransactionCallback() {
        return () => {
            this.handleTxnReply(this.#acceptMsg());
        }
    }

    getRejectTransactionCallback() {
        return () => {
            this.handleTxnReply(this.#rejectMsg());
        }
    }
}
