import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiKey } from 'react-icons/fi'
import authService from '../../src/services/auth-service'   

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validación simple
    if (!email || !password) {
      setError('Por favor, ingrese su email y contraseña')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Usar el servicio de autenticación para iniciar sesión
      await authService.login({
        email,
        password
      })
      
      // Redireccionar al dashboard después de un login exitoso
      navigate('/')
    } catch (err: any) {
      console.error('Error de inicio de sesión:', err)
      
      // Mostrar mensaje de error adecuado
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Error al iniciar sesión. Por favor, intente de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="max-w-md w-full bg-gray-100 rounded-xl shadow-md overflow-hidden p-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-4 mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-500 mt-1">Ingrese sus credenciales para continuar</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
             <FiUser className="h-5 w-5 mr-2 text-gray-400"></FiUser>
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center">
              <FiKey className="h-5 w-5 mr-2 text-gray-400"></FiKey>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar sesión
              </>
            )}
          </button>
        </form>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <button 
            onClick={() => navigate('/reset-password')} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login