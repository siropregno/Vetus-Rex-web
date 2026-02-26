# Sistema de Logging - VetusRex

## 📋 Descripción

Sistema de logging profesional que reemplaza los `console.log` directos. Los logs solo se muestran en **modo desarrollo** (`import.meta.env.DEV`), mantieniendo el código de producción limpio.

## 🚀 Cómo usar

### Importar el logger

```javascript
import logger from '../utils/logger'

// O importar métodos específicos
import { auth, error, success } from '../utils/logger'
```

### Métodos disponibles

#### Logs básicos
```javascript
logger.info('Información general', { data: 'ejemplo' })
logger.success('Operación exitosa', { userId: 123 })
logger.warn('Advertencia importante', { reason: 'timeout' })
logger.error('Error ocurrido', error)
logger.debug('Debug detallado', { step: 1, state: 'loading' })
```

#### Logs especializados
```javascript
// Para autenticación
logger.auth('User signed in', { email: 'user@example.com' })
logger.auth('Session refreshed')

// Para base de datos
logger.db('Profile updated', { userId: '123', fields: ['name', 'email'] })
logger.db('Query executed', { table: 'profiles', action: 'SELECT' })

// Para componentes
logger.component('UserProfile', 'Component mounted', { userId: '123' })
logger.component('Avatar', 'Upload started', { fileSize: '2MB' })

// Para navegación
logger.nav('Route changed', { from: '/home', to: '/profile' })
logger.nav('Redirect triggered', { reason: 'unauthorized' })
```

#### Logs agrupados
```javascript
logger.group('Authentication Process', () => {
  logger.info('Validating credentials')
  logger.info('Checking session')
  logger.success('User authenticated')
})
```

#### Logs con tiempo
```javascript
logger.time('Database Query')
// ... operación lenta
logger.timeEnd('Database Query')
```

#### Logs de tabla (para objetos complejos)
```javascript
const userData = { id: 1, name: 'Juan', email: 'juan@example.com' }
logger.table(userData, 'User Data')
```

## 🎨 Características

### ✅ Solo en desarrollo
- Los logs se muestran únicamente cuando `import.meta.env.DEV` es `true`
- En producción, las llamadas al logger no hacen nada (zero overhead)

### ✅ Categorización visual
- 📝 **Info**: Información general
- ✅ **Success**: Operaciones exitosas
- ⚠️ **Warn**: Advertencias
- ❌ **Error**: Errores
- 🐛 **Debug**: Información de debug
- 🔐 **Auth**: Logs de autenticación
- 🗄️ **DB**: Logs de base de datos
- ⚛️ **Component**: Logs de componentes React
- 🧭 **Nav**: Logs de navegación

### ✅ Contexto enriquecido
Todos los logs incluyen el prefijo `[VetusRex]` para fácil identificación en la consola.

## 🔄 Migración desde console.log

### Antes:
```javascript
console.log('User logged in:', user.email)
console.error('Login failed:', error)
```

### Después:
```javascript
logger.auth('User logged in', { email: user.email })
logger.error('Login failed:', error)
```

## 🛠️ Ejemplos de uso por contexto

### En AuthContext
```javascript
logger.auth('Initializing AuthContext')
logger.auth('Auth state changed', { event, userEmail: session?.user?.email })
logger.success('SignOut completed successfully')
logger.error('Error in signUp:', error)
```

### En Componentes React
```javascript
logger.component('Profile', 'Component mounted', { userId })
logger.warn('Avatar loading failed, using fallback')
logger.success('Profile updated successfully')
```

### En navegación
```javascript
logger.nav('User not authenticated, redirecting to home')
logger.nav('Route protection activated', { requiredRole: 'admin' })
```

### Para operaciones de DB
```javascript
logger.db('Loading profile for user', { userId })
logger.success('Profile loaded successfully')
logger.error('Error loading profile:', error)
```

## 📊 Beneficios

1. **Código limpio en producción**: Los logs no aparecen en la consola del usuario final
2. **Categorización clara**: Fácil identificación del tipo de log
3. **Contexto enriquecido**: Información adicional estructurada
4. **Mejor debugging**: Logs más organizados y legibles
5. **Performance**: Zero overhead en producción
6. **Mantenibilidad**: Un solo lugar para gestionar todo el logging

## 🚫 Lo que NO hacer

```javascript
// ❌ No usar console.log directo
console.log('Something happened')

// ❌ No hacer logging condicional manual
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info')
}

// ✅ Usar el logger
logger.info('Something happened')
logger.debug('Debug info')
```

---

**Nota**: Este sistema está activo en todo el proyecto VetusRex. Los logs se muestran solo en desarrollo y están categorizados para mejor organización.