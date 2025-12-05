import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../layout/App";
import UnderConstruction from "../layout/UnderConstruction";
import Profit from "../pages/Profit";
import Recommendations from "../pages/Recommendations";
import StockProfit from "../pages/StockProfit";
import GymComparison from "../pages/GymComparison";
import GymWizard from "../pages/GymWizard";
import TrainingBreakdown from "../pages/TrainingBreakdown";
import TrainingRecommendations from "../pages/TrainingRecommendations";

const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            { path: "/", element: <GymWizard /> },
            { path: "/recommendations", element: <Recommendations /> },
            { path: "/profit", element: <Profit /> },
            { path: "/stockProfit", element: <StockProfit /> },
            { path: "/gymComparison", element: <GymComparison /> },
            { path: "/gymWizard", element: <GymWizard /> },
            { path: "/trainingBreakdown", element: <TrainingBreakdown /> },
            { path: "/trainingRecommendations", element: <TrainingRecommendations /> },
            { path: "*", element: <UnderConstruction /> },
        ],
    },
]);

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};
