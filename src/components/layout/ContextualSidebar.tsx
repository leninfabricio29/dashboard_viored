import { useLocation } from "react-router-dom";

const ContextualSidebar = () => {
  const { pathname } = useLocation();
  if (!pathname) return null;
  return null;
};

export default ContextualSidebar;
