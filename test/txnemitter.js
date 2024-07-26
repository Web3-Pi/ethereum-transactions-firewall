const process = require('process');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

const { proxy_port } = require('../config/config');
const { DefaultTriggeredRequests } = require('./sandbox/requestgenerator');

const trigger = new DefaultTriggeredRequests(`http://localhost:${proxy_port}`);
