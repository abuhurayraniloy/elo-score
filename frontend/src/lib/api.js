const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
};

export const register = async (username, email, password) => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Registration failed");
  }
  return res.json();
};

export const verifyEmail = async (token) => {
  const res = await fetch(`${BASE_URL}/api/auth/verify?token=${token}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Verification failed");
  }
  return res.json();
};

export const getNextMatch = async () => {
  const res = await fetch(`${BASE_URL}/api/next-match`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 429) {
    const errorData = await res.json();
    throw { status: 429, ...errorData.detail };
  }
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
    throw new Error(data.detail || "Failed to fetch match");
  }
  return res.json();
};

export const submitVote = async (photo_a_id, photo_b_id, winner_id) => {
  const res = await fetch(`${BASE_URL}/api/submit-vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ photo_a_id, photo_b_id, winner_id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
    throw new Error(data.detail || "Failed to submit vote");
  }
  return res.json();
};

export const getLeaderboard = async () => {
  const res = await fetch(`${BASE_URL}/api/leaderboard`);
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
    throw new Error(data.detail || "Failed to fetch leaderboard");
  }
  return res.json();
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/admin/upload-image`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
    throw new Error(data.detail || "Failed to upload image");
  }
  return res.json();
};

export const getAdminStats = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/stats`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

export const getAdminUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/users`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const getAdminPhotos = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/photos`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch photos");
  return res.json();
};

export const deleteAdminPhoto = async (id) => {
  const res = await fetch(`${BASE_URL}/api/admin/photos/${id}`, { 
    method: "DELETE",
    headers: getAuthHeaders() 
  });
  if (!res.ok) throw new Error("Failed to delete photo");
  return res.json();
};

export const updateAdminPhoto = async (id, data) => {
  const res = await fetch(`${BASE_URL}/api/admin/photos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update photo");
  return res.json();
};

export const updateAdminUserRole = async (id, role) => {
  const res = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
};

export const getAdminSettings = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/settings`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
};

export const updateAdminSetting = async (key, value) => {
  const res = await fetch(`${BASE_URL}/api/admin/settings/${key}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ value })
  });
  if (!res.ok) throw new Error("Failed to update setting");
  return res.json();
};
