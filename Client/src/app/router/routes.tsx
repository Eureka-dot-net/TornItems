import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../layout/App";
import UnderConstruction from "../layout/UnderConstruction";
import Profit from "../pages/Profit";
import Recommendations from "../pages/Recommendations";
import StockProfit from "../pages/StockProfit";
import GymComparison from "../pages/GymComparison";
import TrainingBreakdown from "../pages/TrainingBreakdown";

const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            { path: "/", element: <Recommendations /> },
            { path: "/profit", element: <Profit /> },
            { path: "/stockProfit", element: <StockProfit /> },
            { path: "/gymComparison", element: <GymComparison /> },
            { path: "/trainingBreakdown", element: <TrainingBreakdown /> },
            { path: "*", element: <UnderConstruction /> },
        ],
    },
]);

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};