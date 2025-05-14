import { useState, FormEvent } from 'react'
import {  Link } from 'react-router-dom'
import { FiUser, FiMail, FiArrowLeft } from 'react-icons/fi'
import authService from '../../src/services/auth-service'

const ResetPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validación simple
    if (!email) {
      setError('Por favor, ingrese su email')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')
    setNewPassword(null)

    try {
      // Usar el servicio de autenticación para resetear la contraseña
      const response = await authService.resetPassword({
        email
      })
      
      // Mostrar mensaje de éxito y la nueva contraseña
      setMessage(response.message)
      setNewPassword(response.newPassword)
    } catch (err: any) {
      console.error('Error al resetear contraseña:', err)
      
      // Mostrar mensaje de error adecuado
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Error al resetear la contraseña. Por favor, intente de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-gray-100 rounded-xl shadow-md overflow-hidden p-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-full p-4 mb-4 shadow-lg">
            <FiMail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Restablecer Contraseña</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Ingrese su email para recibir una nueva contraseña
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {message && newPassword && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
            <div className="font-medium">{message}</div>
            <div className="mt-2">
              <p>Tu nueva contraseña es:</p>
              <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded font-mono text-lg text-center">
                {newPassword}
              </div>
              <p className="text-sm mt-2">
                Por favor, guarda esta contraseña en un lugar seguro y cámbiala después de iniciar sesión.
              </p>
            </div>
          </div>
        )}
        
        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
               <FiUser className="h-5 w-5 mr-2 text-gray-400"></FiUser>
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-300"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition duration-300 flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Restablecer Contraseña
                </>
              )}
            </button>
          </form>
        )}
        
        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-slate-600 hover:text-slate-800 font-medium"
          >
            <FiArrowLeft className="mr-2" />
            Volver a Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword