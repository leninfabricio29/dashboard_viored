import { useLocation } from "react-router-dom";
import Members from "../../pages/modules/Entity/Members";
import AlertsHistory from "../../pages/modules/Entity/AlertsHistory";
import HistoryAdmin from "../../pages/modules/Entity/HistoryAdmin";

const ContextualSidebar = () => {
  const { pathname } = useLocation();

  let content = null;

  if (pathname.includes("/monitoring/members")) {
    content = <Members />;
  } else if (pathname.includes("/monitoring/alerts-history")) {
    content = <AlertsHistory />;
  } else if (pathname.includes("/monitoring/history-admin")) {
    content = <HistoryAdmin />;
  }

  if (!content) return null;

  return (
 <div className="absolute top-20 left-[5rem] w-80 h-[calc(100%-5rem)] bg-yellow-500 shadow-lg z-40 p-4 overflow-y-auto">
  {content}
</div>
  );
};

export default ContextualSidebar;
