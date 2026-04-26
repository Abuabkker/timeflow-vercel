import axios from "axios";

// Frontend and API are on the same Vercel domain — just use /api
const api = axios.create({ baseURL: "/api", timeout: 20000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem("tf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tf_token");
      localStorage.removeItem("tf_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;

export const Auth = {
  login: (userId, pin) => api.post("/auth/login", { userId, pin }),
  me:    ()            => api.get("/auth/me"),
};

export const Users = {
  list:   ()          => api.get("/users"),
  full:   ()          => api.get("/users/full"),
  create: (data)      => api.post("/users", data),
  update: (id, data)  => api.put(`/users/${id}`, data),
  remove: (id)        => api.delete(`/users/${id}`),
};

export const Sessions = {
  today:       ()      => api.get("/sessions/today"),
  checkin:     ()      => api.post("/sessions/checkin"),
  checkout:    ()      => api.post("/sessions/checkout"),
  breakStart:  ()      => api.post("/sessions/break?action=start"),
  breakEnd:    ()      => api.post("/sessions/break?action=end"),
  addTask:     (title) => api.post("/sessions/tasks", { title }),
  startTask:    (id)   => api.patch(`/sessions/tasks?taskId=${id}&action=start`),
  pauseTask:    (id)   => api.patch(`/sessions/tasks?taskId=${id}&action=pause`),
  completeTask: (id)   => api.patch(`/sessions/tasks?taskId=${id}&action=complete`),
  admin:       (date)  => api.get(`/sessions/admin${date ? `?date=${date}` : ""}`),
};

export const Reports = {
  list:     ()               => api.get("/reports"),
  get:      (m, y)           => api.get(`/reports?month=${m}&year=${y}`),
  generate: (m, y, email)    => api.post("/reports", { month: m, year: y, sendEmail: email }),
  pdfUrl:   (m, y)           => `/api/reports?month=${m}&year=${y}&pdf=1`,
};
