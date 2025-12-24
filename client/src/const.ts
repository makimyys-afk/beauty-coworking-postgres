export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_NAME || import.meta.env.VITE_APP_TITLE || "Бьюти-коворкинг";

export const APP_LOGO = import.meta.env.VITE_APP_LOGO || "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL - redirect to local login page
export const getLoginUrl = () => {
  return "/login";
};
