const { ValidatingRequestProcessor } = require('./requestprocessor');
var http = require('http');

// FIXME; decide how to present transaction numbers, possible options:
// - increase counter only for transactions that were processed by the frontent (current behavior)
// - increase counter for every submitted transaction (and use in on the frontend)
// - show request id from the original request (this may be number, but also an uuid)

class ValidatingProxy {

    constructor(endpointUrl, wssPort) {
        this.endpointUrl = endpointUrl;
        this.requestProcessor = new ValidatingRequestProcessor(endpointUrl, wssPort);

        this.server = http.createServer((req, res) => {
            this.requestProcessor.processRequest(req, res);
        });
    }

    listen(port, callback) {
        this.server.listen(port, () => {
            callback();
        });
    }
}

exports.ValidatingProxy = ValidatingProxy;
