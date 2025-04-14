import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../../services/user-service';

import { User } from '../../../types/user.types';
import ButtonHome from '../../../components/UI/ButtonHome';
import ButtonIndicator from '../../../components/UI/ButtonIndicator';
import { FiSearch } from 'react-icons/fi';


const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los datos. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    );
  }, [searchTerm, users]);


  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="max-w-5xl mx-auto"> {/* Contenedor con ancho máximo centrado */}
    <ButtonIndicator></ButtonIndicator>
   <div className="mb-6">
  <div className="relative w-96">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FiSearch className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type="text"
      placeholder="Buscar usuario..."
      className="block w-full pl-10 pr-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>
  
    {loading ? (
      <p className="text-center text-gray-500">Cargando usuarios...</p>
    ) : error ? (
      <p className="text-center text-red-500">{error}</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Exactamente 3 columnas en pantallas grandes */}
        {currentUsers.length > 0 ? (
          currentUsers.map((user) => (
            <div key={user._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center space-x-4">
                <img
                  src={"https://cdn-icons-png.flaticon.com/512/3607/3607444.png"}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.phone}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
                <div className="flex space-x-2">
                  <Link to={`/users/${user._id}`} title="Ver detalles">
                    <button className="bg-indigo-600 rounded p-1 text-gray-100 hover:bg-indigo-700 cursor-pointer text-sm">                    Ver detalles
                    </button>
                  </Link>
                 
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            {searchTerm ? "No se encontraron usuarios con esa búsqueda" : "No hay usuarios disponibles"}
          </p>
        )}
      </div>
    )}
  
    {/* Paginación */}
    {totalPages > 1 && (
      <div className="flex justify-center mt-6 space-x-2">
        {totalPages > 1 && (
  <div className="flex justify-center mt-6 space-x-2">
    <button
      className={`px-4 py-2 text-sm rounded-md ${currentPage === 1 ? "bg-gray-300" : "bg-blue-600 text-white"}`}
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    >
      Anterior
    </button>
    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        className={`px-4 py-2 text-sm rounded-md ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        onClick={() => setCurrentPage(i + 1)}
      >
        {i + 1}
      </button>
    ))}
    <button
      className={`px-4 py-2 text-sm rounded-md ${currentPage === totalPages ? "bg-gray-300" : "bg-blue-600 text-white"}`}
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    >
      Siguiente
    </button>
  </div>
)}
      </div>
    )}
  
    <ButtonHome></ButtonHome>
  </div>
  );
};

export default UsersList;




