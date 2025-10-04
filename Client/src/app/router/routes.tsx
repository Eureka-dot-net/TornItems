import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../layout/App";
import UnderConstruction from "../layout/UnderConstruction";

const router = createBrowserRouter([
    {
        element: <App />,
        children: [
            // All routes show the maintenance page
            { path: "/", element: <UnderConstruction /> },
            { path: "*", element: <UnderConstruction /> },
        ],
    },
]);

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};