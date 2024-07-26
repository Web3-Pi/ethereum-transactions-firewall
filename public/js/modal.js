import {accept_duration} from "./config.js";

export class ModalWindowError {
    constructor() {
        this.errModal = $('#connectionLostModal');
    }

    show() {
        this.errModal.modal("show");
    }
}

export class TxnAcceptorModalResult {
    constructor(txnId, timeout) {
        this.txnId = txnId;
        this.timeout = timeout;
    }

    update(other) {
        this.txnId = other.txnId;
        this.timeout = other.timeout;
    }
}

export class ModalWindowTxnAcceptor {
    constructor() {
        this.txnModal = $('#txnAcceptModal');
        this.progbar = document.getElementById('progbar');
        this.icon = document.querySelector("img");
        this.headerMessageField = document.getElementById('txn-header-message');
        this.fromField = document.getElementById('link-from');
        this.fromLabel = document.getElementById('from-label');
        this.toField = document.getElementById('link-to');
        this.toLabel = document.getElementById('to-label');
        this.valueField = document.getElementById('eth-val');
        this.dataField = document.getElementById('data_display');
    }

    #animateProgress() {
        this.progbar.animate(
            {
                width: [CSS.percent(0), CSS.percent(100)],
            },
            {
                duration: accept_duration + 100,
                iterations: Infinity,
            },
        );

        this.icon.animate(
            {
                opacity: [1, 0]
            },
            {
                duration: accept_duration + 100,
                iterations: Infinity,
            },
        );
    }

    #getTxnId(id) {
        let txnId = id;
        if (id < 1000) {
            const s = "00" + id;
            txnId = s.substring(s.length - 3);
        }

        return txnId;
    }

    #renderHeader(id) {
        this.headerMessageField.textContent = `Do you want to accept transaction ${this.#getTxnId(id)}`;
    }

    #renderAddr(htmlElt, addr, labelElt, labelText) {
        htmlElt.textContent = addr;
        htmlElt.setAttribute('href', `https://etherscan.io/address/${addr}`);
        labelElt.textContent = labelText;
    }

    #renderAddrData(txn, labelFrom, labelTo) {
        this.#renderAddr(this.fromField, txn.from, this.fromLabel, labelFrom);
        this.#renderAddr(this.toField, txn.to, this.toLabel, labelTo);
    }

    #renderValue(value) {
        this.valueField.textContent = (Number(BigInt(value)) / 1000000000000000000.0).toLocaleString() + " ETH";
    }

    #renderData(data) {
        let isDisabled = true;
        let numRows = 0;

        if (data.length > 0) {
            isDisabled = false;
            numRows = 4;
        }

        this.dataField.setAttribute('rows', numRows);
        this.dataField.setAttribute('disabled', isDisabled);
        this.dataField.textContent = data;
    }

    #renderTxnContents(labelFrom, labelTo, txn) {
        this.#renderAddrData(txn, labelFrom, labelTo);
        this.#renderValue(txn.value);
        this.#renderData(txn.data);
    }

    #initRendering(txn, labelFrom, labelTo, id) {
        this.#renderHeader(id);
        this.#renderTxnContents(labelFrom, labelTo, txn);

        this.#animateProgress();
    }

    #handleModalWindow(payload) {
        this.#initRendering(payload.txn, payload.labelFrom, payload.labelTo, payload.id);

        this.txnModal.modal("show");
        const modal = this.txnModal;

        return setTimeout(function () {
            if (modal.hasClass('show')) {
                modal.find('.btn-close').click();
            }
        }, accept_duration);
    }

    showAndQuery(rawTxnData) {
        const payload = JSON.parse(rawTxnData);
        const timeout = this.#handleModalWindow(payload);

        return new TxnAcceptorModalResult(payload.id, timeout);

    }

    registerCloseCallbacks(callbackAccept, callbackReject) {
        this.txnModal.find('.btn-close').click(callbackReject);
        this.txnModal.find('.reject-txn').click(callbackReject);
        this.txnModal.find('.accept-txn').click(callbackAccept);
    }
}
