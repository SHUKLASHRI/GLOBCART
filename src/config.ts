// All Supabase credentials live in the backend (api/index.py).
// The frontend ONLY needs the backend API URL to make requests.
export const CONFIG = {
    BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL || '/api'
};
