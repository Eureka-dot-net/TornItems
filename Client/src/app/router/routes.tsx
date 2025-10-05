import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../layout/App";
import UnderConstruction from "../layout/UnderConstruction";
import Profit from "../pages/Profit";

const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            // All routes show the maintenance page
            { path: "/", element: <UnderConstruction /> },
            { path: "/profit", element: <Profit /> },
            { path: "*", element: <UnderConstruction /> },
        ],
    },
]);

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};