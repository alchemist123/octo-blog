export class Logger {
    static mode = process.env.DEBUG == 'true' ? 'DEBUG' : 'LIVE';
    static debug(..._) {
      // if (Logger.mode !== 'DEBUG') return;
      console.log('Debug: ', ..._);
    }
    static info(..._) {
      console.log('Info: ', ..._);
    }
    static error(..._) {
      console.log('Error: ', ..._);
    }
  }
  