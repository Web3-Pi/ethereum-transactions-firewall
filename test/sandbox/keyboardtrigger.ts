import * as readline from 'readline'

interface KeyEvent {
  name: string
  ctrl?: boolean
}

type CallbackFunction = () => Promise<void>

export class KeyboardTriggerAsync {
  private callbackMapping: Record<string, CallbackFunction>

  constructor() {
    this.callbackMapping = {}
    readline.emitKeypressEvents(process.stdin)
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }
    
    process.stdin.on('keypress', async (_chunk: string | Buffer, key: KeyEvent) => {
      if (key && key.name === 'c' && key.ctrl === true) {
        console.log('Closing the app...')
        process.exit(0)
      } else if (key.name in this.callbackMapping) {
        try {
          await this.callbackMapping[key.name]()
        } catch (error) {
          console.log(`Request error ${error}`)
        }
      } else {
        console.log(`No callback registered for the key named ${key.name}`)
      }
    })
  }

  addCallback(keyName: string, callback: CallbackFunction): void {
    this.callbackMapping[keyName] = callback
  }
}