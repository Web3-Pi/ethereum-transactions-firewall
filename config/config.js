// https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786

const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  throw result.error;
}

const { parsed: envs } = result;

module.exports = envs;
