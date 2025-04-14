import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ModuleCardProps {
  title: string
  path: string
  icon: ReactNode
  bgColor: string
  iconColor: string
}

const ModuleCard = ({ title, path, icon, bgColor, iconColor }: ModuleCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(path)
  }

  return (
    <div
      className="border-4 border-gray-300 bg-white text-gray-600 p-4 rounded cursor-pointer  flex flex-col items-center justify-center hover:translate-y-[-4px] transition-all duration-300"
      onClick={handleClick}
    >
      <div
        className={`${bgColor} ${iconColor} w-16 h-16 rounded flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-medium text-center">{title}</h3>
    </div>
  )
}

export default ModuleCard