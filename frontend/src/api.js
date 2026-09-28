import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL||"http://localhost:5000/api"
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("queuewise_token");
  if (token) {
    config.headers.Authorization=`Bearer ${token}`;
  }
return config;
});
export const authApi ={
  register: (data) =>api.post("/auth/register", data),
  login: (data) =>api.post("/auth/login", data),
  getMe: () => api.get("/auth/me")
};
export const businessApi ={
  list: (params) => api.get("/businesses", { params }),
  getOne: (businessId) => api.get(`/businesses/${businessId}`),
  myBusinesses: () => api.get("/businesses/mine"),
  create: (data) => api.post("/businesses", data),
  update: (businessId, data) =>
    api.patch(`/businesses/${businessId}`, data)
};
export const queueApi={
  getSnapshot: (businessId) =>
    api.get(`/businesses/${businessId}/queue`),
join: (businessId) =>
    api.post(`/businesses/${businessId}/queue/join`),

  getMyTicket: (businessId) =>
    api.get(`/businesses/${businessId}/queue/my-ticket`),

  cancelMyTicket: (businessId) =>
    api.patch(`/businesses/${businessId}/queue/my-ticket/cancel`),

  serveNext: (businessId) =>
    api.patch(`/businesses/${businessId}/queue/serve-next`),
  updateEntryStatus: (businessId, entryId, status) =>
    api.patch(`/businesses/${businessId}/queue/${entryId}/status`, {
      status
    })
};