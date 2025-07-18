
import { Outlet } from "react-router-dom";
import Header from "./Header";

const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin={false} />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
