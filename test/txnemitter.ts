import * as process from 'process'
import * as path from 'path'

process.chdir(path.join(__dirname, '..'))

import config from '../src/config/config'
import { DefaultTriggeredRequests } from './sandbox/requestgenerator'

const trigger = new DefaultTriggeredRequests(`http://localhost:${config.proxy_port}`)

// Export trigger to prevent it from being garbage collected
export default trigger