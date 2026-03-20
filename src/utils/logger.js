


const isDevelopment = import.meta.env.DEV

class Logger {
  constructor() {
    this.isDev = isDevelopment
    this.prefix = '[VetusRex]'
  }


  info(message, ...args) {
    if (this.isDev) {
      console.log(`${this.prefix} 📝`, message, ...args)
    }
  }


  success(message, ...args) {
    if (this.isDev) {
      console.log(`${this.prefix} ✅`, message, ...args)
    }
  }


  warn(message, ...args) {
    if (this.isDev) {
      console.warn(`${this.prefix} ⚠️`, message, ...args)
    }
  }


  error(message, ...args) {
    if (this.isDev) {
      console.error(`${this.prefix} ❌`, message, ...args)
    }
  }


  debug(message, ...args) {
    if (this.isDev) {
      console.debug(`${this.prefix} 🐛`, message, ...args)
    }
  }


  auth(action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} 🔐 [AUTH]`, action, details)
    }
  }


  db(action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} 🗄️ [DB]`, action, details)
    }
  }


  component(componentName, action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} ⚛️ [${componentName}]`, action, details)
    }
  }


  nav(action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} 🧭 [NAV]`, action, details)
    }
  }


  group(label, callback) {
    if (this.isDev) {
      console.group(`${this.prefix} 📁`, label)
      callback()
      console.groupEnd()
    }
  }


  time(label) {
    if (this.isDev) {
      console.time(`${this.prefix} ⏱️ ${label}`)
    }
  }

  timeEnd(label) {
    if (this.isDev) {
      console.timeEnd(`${this.prefix} ⏱️ ${label}`)
    }
  }


  table(data, label = 'Data') {
    if (this.isDev) {
      console.log(`${this.prefix} 📊 ${label}:`)
      console.table(data)
    }
  }
}


const logger = new Logger()

export default logger


export const { info, success, warn, error, debug, auth, db, component, nav, group, time, timeEnd, table } = logger
