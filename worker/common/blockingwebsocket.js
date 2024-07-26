class BlockingWebSocket {

    constructor(ws) {
        this.ws = null;

        if (ws != null) {
            this.updateActiveWebSocket(ws);
        }

        this.queryOngoing = false;
        this.counter = 0;
    }

    updateWebSocket(ws) {
        ws.cc = this.counter++;
        console.log(`New websocket connection: ${ws.cc}`);

        if (this.ws != null) {
            // console.log(`Replacing connection: ${this.ws.cc}`);
            this.ws.close();
        }

        ws.receive = () => {
            return new Promise((resolve, reject) => {
                ws.onmessage = (msg) => {
                    return resolve(msg.data);
                }
    
                ws.onerror = (error) => {
                    return reject(error);
                }
            });
        }
    
        ws.on("close", () => {
            console.log(`Closing connection: ${ws.cc} - reason: connection closed`);
            // console.log(`this cc ${this.ws.cc} vs ws cc ${ws.cc}`);
            if (this.cc == ws.cc) {
                this.ws = null;
            }

            this.queryOngoing = false;
        })

        ws.onerror = () => {
            console.log(`Closing connection: ${ws.cc} - reason: connection error`);
            // console.log(`this cc ${this.ws.cc} vs ws cc ${ws.cc}`);
            if (this.cc == ws.cc) {
                this.ws = null;
            }

            this.queryOngoing = false;
        }

        this.ws = ws;
        this.queryOngoing = false;
    }

    isBusy() {
        return this.queryOngoing;
    }

    isActive() {
        return this.ws != null;
    }

    async send(data) {
        this.queryOngoing = true;

        this.ws.send(data);
        const res = await this.ws.receive();

        this.queryOngoing = false;

        return res;
    }
};

exports.BlockingWebSocket = BlockingWebSocket
