import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../layout/App";
import UnderConstruction from "../layout/UnderConstruction";
import Profit from "../pages/Profit";
import Recommendations from "../pages/Recommendations";
import StockProfit from "../pages/StockProfit";

const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            // All routes show the maintenance page
            { path: "/", element: <UnderConstruction /> },
            { path: "/profit", element: <Profit /> },
            { path: "/recommendations", element: <Recommendations /> },
            { path: "/stockProfit", element: <StockProfit /> },
            { path: "*", element: <UnderConstruction /> },
        ],
    },
]);

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};