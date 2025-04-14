import { Outlet } from 'react-router-dom'
import Header from './Header'

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      <Header />
      <main className="flex-grow p-4 m-4 rounded shadown  sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout