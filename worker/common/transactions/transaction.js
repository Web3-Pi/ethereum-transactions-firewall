class StubTransaction {
    
    constructor(from, to, value, data, parsedData) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.data = data;
        this.parsedData = parsedData;
    }

    toString() {
        return JSON.stringify(this);
    }

}

class TransactionPayload {
    constructor(id, labelFrom, labelTo, txn) {
        this.id = id;
        this.labelFrom = labelFrom;
        this.labelTo = labelTo;
        this.txn = txn;
    }

    toString() {
        return JSON.stringify(this);
    }
}

exports.StubTransaction = StubTransaction;
exports.TransactionPayload = TransactionPayload;
