import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Extend Axios request config to include _retry
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const API_BASE_URL = "http://localhost:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// A flag to prevent multiple refresh requests from being sent simultaneously
let isRefreshing = false;

// FIX: Queue now stores the request configuration object
let failedRequestsQueue: {
  config: InternalAxiosRequestConfig; // <-- Stores the original config
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
}[] = [];

/**
 * Attaches a request to the queue to be retried later.
 */
const retryFailedRequest = (error: AxiosError) => {
  return new Promise<AxiosResponse>((resolve, reject) => {
    // FIX: Push the original request config along with resolve/reject
    failedRequestsQueue.push({
      config: error.config as InternalAxiosRequestConfig,
      resolve,
      reject,
    });
  });
};

/**
 * Interceptor that handles expired Access Tokens and initiates a token refresh.
 */
API.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // 1. Check if the error is a 401 Unauthorized AND it hasn't been retried
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest!._retry = true; // Mark the request for retry

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // 2. Call the backend to get a new token pair
          await API.post("/auth/token/refresh");

          // New tokens are set in the cookie jar by the browser.
          isRefreshing = false;

          // 3. FIX: Iterate and resolve the queue using a loop that supports await
          // Use a simple map and Promise.all to process the queue, ensuring proper await.
          const retryPromises = failedRequestsQueue.map(async (p) => {
            // Execute the API call and wait for the response
            const response = await API(p.config);
            // Resolve the original promise with the successful response
            p.resolve(response);
          });

          await Promise.all(retryPromises);

          failedRequestsQueue = [];

          // 4. Immediately retry the request that triggered the refresh
          return API(originalRequest!);
        } catch (refreshError) {
          // Refresh failed (token expired/revoked): Log user out
          isRefreshing = false;

          // Reject all queued requests
          failedRequestsQueue.forEach((p) => p.reject(refreshError));
          failedRequestsQueue = [];

          // TODO: Redirect user to login page
          // window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // 6. If a refresh is already in progress, queue the current failed request
      return retryFailedRequest(error);
    }

    // Pass through non-401 or already-retried errors
    return Promise.reject(error);
  }
);

export default API;
