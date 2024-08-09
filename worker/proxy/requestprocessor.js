const WebSocketTransactionValidator = require('./transactionvalidator').WebSocketTransactionValidator;
var request = require('request');


class ValidatingRequestProcessor {

    constructor(endpointUrl, wssPort) {
        this.endpointUrl = endpointUrl;
        this.txnValidator = new WebSocketTransactionValidator(endpointUrl, wssPort);
    }

    #logNewRequest(reqData) {
        let paramsStr = JSON.stringify(reqData.params);
        if (paramsStr.length > 150) {
            paramsStr = paramsStr.substring(0, 150) + ` ..."]`;
        }

        console.log(`New request: ${reqData.method} -> params : ${paramsStr}`);
    }

    defaultReponseSetter(res, response) {
        res.statusCode = response.statusCode;
        for (const header in response.headers) {
            if (header.toLocaleLowerCase() !== 'content-length') {
                res.setHeader(header, response.headers[header]);
            }
        }

        // console.log("Response body:");
        // console.log(JSON.stringify(response.body).length > 500 ? JSON.stringify(response.body).substring(0, 500) + "..." : response.body);

        res.end(JSON.stringify(response.body));
    }

    // FIXME: correct error code and error message should be returned here
    invalidResponseSetter(res, reqData) {
        res.writeHead(200, {'content-type': 'application/json'});
        const responseBody = 
        {
            jsonrpc: '2.0',
            id: reqData.id,
            error: {
                code: -32000,
                message: 'err: potential phishing attempt detected - reverting transaction'
            }
        }

        // console.log("Response body:");
        // console.log(responseBody);

        res.end(JSON.stringify(responseBody));
    }

    validatingResponseHandler(data, res) {
        const reqData = JSON.parse(data);
        
        this.#logNewRequest(reqData);

        this.txnValidator.validateTransactionOnce(reqData,
            () => {
                request({
                    url: this.endpointUrl,
                    method: 'POST',
                    json: reqData,
                },
                (error, response, body) => {
                    this.defaultReponseSetter(res, response);
                });    
            },
            () => {
                this.invalidResponseSetter(res, reqData);
            }
        );
    }

    processRequest(req, res) {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            // console.log('New request');
            // console.log(JSON.parse(data));

            this.validatingResponseHandler(data, res);
        });
    }
}

exports.ValidatingRequestProcessor = ValidatingRequestProcessor;
