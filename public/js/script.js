import {websocket_server_port} from "./config.js";
import {ModalWindowError, ModalWindowTxnAcceptor, TxnAcceptorModalResult} from "./modal.js";
import {TxnAcceptor} from "./transactions.js";


// FIXME: handle inactive connections (implement heartbeats if necessary)
export class TransactionsHandler {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.#configureHandler(this.ws);
    }

    #configureHandler(ws) {
        const errModal = new ModalWindowError();
        const txnAcceptorModal = new ModalWindowTxnAcceptor();

        const result = new TxnAcceptorModalResult(null, null);
        const txnAcceptor = new TxnAcceptor(ws, result);

        // Configure websocket listeners
        ws.addEventListener("open", () => {
            console.log("We are connected");
        });

        ws.addEventListener('message', function (event) {
            result.update(txnAcceptorModal.showAndQuery(event.data));
        });

        ws.addEventListener('close', (event) => {
            errModal.show();
        })

        ws.addEventListener('error', (error) => {
            errModal.show();
        })

        // Configure txnAcceptorModal listeners
        txnAcceptorModal.registerCloseCallbacks(txnAcceptor.getAcceptTransactionCallback(), txnAcceptor.getRejectTransactionCallback());
    }

}

class Main {
    static main() {
        $(document).ready( () => {
            let wssHost = `ws://${window.location.hostname}:${websocket_server_port}`;
            this.handler = new TransactionsHandler(wssHost);
        });
    }
}

Main.main();
