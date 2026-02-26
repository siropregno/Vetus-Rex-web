// Logger para el proyecto VetusRex
// Solo funciona en modo desarrollo

const isDevelopment = import.meta.env.DEV

class Logger {
  constructor() {
    this.isDev = isDevelopment
    this.prefix = '[VetusRex]'
  }

  // Log informativo general
  info(message, ...args) {
    if (this.isDev) {
      console.log(`${this.prefix} 📝`, message, ...args)
    }
  }

  // Log de éxito
  success(message, ...args) {
    if (this.isDev) {
      console.log(`${this.prefix} ✅`, message, ...args)
    }
  }

  // Log de advertencia
  warn(message, ...args) {
    if (this.isDev) {
      console.warn(`${this.prefix} ⚠️`, message, ...args)
    }
  }

  // Log de error
  error(message, ...args) {
    if (this.isDev) {
      console.error(`${this.prefix} ❌`, message, ...args)
    }
  }

  // Log de debug (más detallado)
  debug(message, ...args) {
    if (this.isDev) {
      console.debug(`${this.prefix} 🐛`, message, ...args)
    }
  }

  // Log específico para autenticación
  auth(action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} 🔐 [AUTH]`, action, details)
    }
  }

  // Log específico para base de datos
  db(action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} 🗄️ [DB]`, action, details)
    }
  }

  // Log específico para componentes
  component(componentName, action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} ⚛️ [${componentName}]`, action, details)
    }
  }

  // Log específico para navegación
  nav(action, details = {}) {
    if (this.isDev) {
      console.log(`${this.prefix} 🧭 [NAV]`, action, details)
    }
  }

  // Agrupa logs relacionados
  group(label, callback) {
    if (this.isDev) {
      console.group(`${this.prefix} 📁`, label)
      callback()
      console.groupEnd()
    }
  }

  // Log con tiempo
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

  // Log de tabla (útil para objetos complejos)
  table(data, label = 'Data') {
    if (this.isDev) {
      console.log(`${this.prefix} 📊 ${label}:`)
      console.table(data)
    }
  }
}

// Crear instancia única del logger
const logger = new Logger()

export default logger

// También exportar métodos individuales para facilitar el uso
export const { info, success, warn, error, debug, auth, db, component, nav, group, time, timeEnd, table } = logger