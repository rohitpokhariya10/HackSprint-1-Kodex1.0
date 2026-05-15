import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { router } from "./router";
import { store } from "./store";
import { Providers } from "./providers";

export function App() {
  return (
    <Provider store={store}>
      <Providers>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" theme="dark" />
      </Providers>
    </Provider>
  );
}
