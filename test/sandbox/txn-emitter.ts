import { DefaultTriggeredRequests } from "./request-generator.js";
import config from "../../src/config/config.js";

new DefaultTriggeredRequests(`http://localhost:${config.proxyPort}`);
