export class TransactionDetailsRenderer {
    constructor() {
        this.txnDataPlaceholder = document.getElementById('txnDetailsPlaceholder');
        this.elementsToRemove = [];
    }

    #getHeaderElement(fun, funLabel, renderDataLabel) {
        const wrapper = document.createElement('tr');
        const dataField = renderDataLabel ? "<strong>Data</strong>" : "";
        wrapper.innerHTML = [
            `<tr id="txnDetailsPlaceholderHeader">`,
            `    <td class="text-left flat">${dataField}</td>`,
            `    <td class="text-left flat no-left-padding"><span class="call-descr">${funLabel}: <strong>${fun.name}</strong> ${fun.details}</span></td>`,
            `</tr>`,
        ].join('');

        return wrapper;
    }

    #getDetailsHTMLStart() {
        return [
            `<tr>`,
            `    <td></td>`,
            `    <td class="td-decoded-txn">`,
            `        <div class="overflow-auto decoded-txn">`,
            `            <table class="table table-sm table-hover table-borderless text-left ">`,
            `              <thead class="table-light"><tr><th>#</th><th>Arg</th><th>Type</th><th>Data</th></tr></thead>`,
            `                <tbody class="table-light">`,
        ].join('');
    }

    #getDetailsHTMLEnd() {
        return [
            `             </tbody>`,
            `           </table>`,
            `       </div>`,
            `    </td>`,
            `</tr>`
        ].join('');
    }

    #getArgAddr(argNo, addr) {
        return [
            `                    <tr>`,
            `                        <td>${argNo}</td><td>${addr.argName}</td>`,
            `                        <td>${addr.typeName}</td>`,
            `                        <td>`,
            `                            <strong class="txn-label-inner">${addr.label}</strong>`,
            `                            <a href="https://etherscan.io/address/${addr.address}" target="_blank" class="link-secondary link-offset-1-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover">${addr.address}</a>`,
            `                        </td>`,
            `                    </tr>`
        ].join('');
    }

    #getArgVal(argNo, val) {
        return [
            `                    <tr>`,
            `                       <td>${argNo}</td><td>${val.argName}</td><td>${val.typeName}</td><td><span data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="${val.toolTip}">${val.value}</span></td>`,
            `                    </tr>`
        ].join('');
    }

    #getDefaultArgVal(argNo, arg) {
        return [
            `                    <tr>`,
            `                       <td>${argNo}</td><td>${arg.argName}</td><td>${arg.typeName}</td><td><span>${arg.value}</span></td>`,
            `                    </tr>`
        ].join('');
    }

    #getTransferCallArgsElement(args) {
        const wrapper = document.createElement('tr');
        wrapper.innerHTML = "".concat(
            this.#getDetailsHTMLStart(),
            this.#getArgAddr(0, args.address),
            this.#getArgVal(1, args.value),
            this.#getDetailsHTMLEnd()
        );

        return wrapper;
    }

    #getSubmitTxnCallArgsElement(args) {
        const wrapper = document.createElement('tr');
        wrapper.innerHTML = "".concat(
            this.#getDetailsHTMLStart(),
            this.#getArgAddr(0, args.destination),
            this.#getArgVal(1, args.value),
            this.#getDefaultArgVal(2, args.data),
            'nonce' in args ? this.#getDefaultArgVal(3, args.nonce) : '',
            this.#getDetailsHTMLEnd()
        );

        return wrapper;
    }

    #getConfirmTxnCallArgsElement(args) {
        const wrapper = document.createElement('tr');
        wrapper.innerHTML = "".concat(
            this.#getDetailsHTMLStart(),
            this.#getDefaultArgVal(0, args.txnId),
        );

        return wrapper;

    }

    #getDepositTxnCallArgsElement(args) {
        const wrapper = document.createElement('tr');
        wrapper.innerHTML = "".concat(
            this.#getDetailsHTMLStart(),
            this.#getDefaultArgVal(0, args.pubkey),
            this.#getDefaultArgVal(1, args.withdrawal_credentials),
            this.#getDefaultArgVal(2, args.signature),
            this.#getDefaultArgVal(3, args.deposit_data_root),
            this.#getDetailsHTMLEnd()
        );

        return wrapper;
    }

    #appendDetailsElement(elt) {
        this.txnDataPlaceholder.append(elt);
        this.elementsToRemove.push(elt);
    }

    #renderEntry(entry, fun, funLabel="Function", renderDataLabel=true) {
        this.#appendDetailsElement(this.#getHeaderElement(fun, funLabel, renderDataLabel));
        this.#appendDetailsElement(entry);
    }

    #clearDynamicContent() {
        this.elementsToRemove.forEach((elt) => (elt.remove()));
    }

    #renderGLMTransfer(txn) {
        const call = txn.parsedData;
        this.#renderEntry(this.#getTransferCallArgsElement(call.args), call.fun);
    }

    #renderSubmitTxn(txn) {
        const call = txn.parsedData;
        this.#renderEntry(this.#getSubmitTxnCallArgsElement(call.args), call.fun);
    }

    #renderConfirmTxn(txn) {
        const call = txn.parsedData;
        this.#renderEntry(this.#getConfirmTxnCallArgsElement(call.args), call.fun);

        if ('confirmedTxn' in call)
            this.#renderEntry(this.#getSubmitTxnCallArgsElement(call.confirmedTxn.args), call.confirmedTxn.fun, "Confirms", false);
    }

    #renderBeaconDeposit(txn) {
        const call = txn.parsedData;
        this.#renderEntry(this.#getDepositTxnCallArgsElement(call.args), call.fun);
    }

    #renderDefaultDataView(txn) {
        const data = txn.data;
        const wrapper = document.createElement('tr');
        wrapper.innerHTML = [
            `<tr>`,
            `    <td class="text-left flat"><strong>Data</strong></td>`,
            `    <td class="text-right flat">`,
            `        <textarea class="form-control data_display" rows="4" id="data_display" readonly disabled>${data}</textarea>`,
            `    </td>`,
            `</tr>`
        ].join('');

        this.#appendDetailsElement(wrapper);
    }

    #getRenderFun(txn) {
        let res = (txn) => { this.#renderDefaultDataView(txn) };

        const renderers = {
            'glmtransfer': (txn) => { this.#renderGLMTransfer(txn) },
            'ms0submitTransaction': (txn) => { this.#renderSubmitTxn(txn) },
            'ms0confirmTransaction': (txn) => { this.#renderConfirmTxn(txn) },
            'ms1submitTransaction': (txn) => { this.#renderSubmitTxn(txn) },
            'ms1confirmTransaction': (txn) => { this.#renderConfirmTxn(txn) },
            'bdcdeposit': (txn) => { this.#renderBeaconDeposit(txn) }
        }

        const data = txn.parsedData;

        if ('contract' in data) {
            const rendererId = [data.contract, data.fun.name].join('');
            if (rendererId in renderers) {
                res = renderers[rendererId];
            }
        }

        return res;
    }

    renderTxn(txn) {
        this.#clearDynamicContent();

        const renderFun = this.#getRenderFun(txn);
        renderFun(txn);
    }
}
