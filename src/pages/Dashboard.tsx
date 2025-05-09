

const Dashboard = () => {
  return (
    <div className="py-8">
      {/* Encabezado */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido al Panel</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Resumen general del sistema
        </p>
      </div>
      
      {/* Aquí puedes agregar métricas, gráficos, etc. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      </div>
    </div>
  );
};


export default Dashboard