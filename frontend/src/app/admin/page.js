"use client";

import { useState, useEffect } from "react";
import { 
  uploadImage, getAdminStats, getAdminUsers, 
  getAdminPhotos, deleteAdminPhoto, getAdminSettings, 
  updateAdminSetting, updateAdminPhoto, updateAdminUserRole,
  updateAdminUserApproval, getUserInfo, deleteAdminUser
} from "../../lib/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Synchronous security check on first render
  if (typeof window !== "undefined") {
    const userInfo = getUserInfo();
    if (!userInfo || userInfo.role !== "admin") {
      window.location.href = "/";
      return null;
    }
  }

  // Editing state
  const [editingPhoto, setEditingPhoto] = useState(null);

  // Upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "overview") {
        const data = await getAdminStats();
        setStats(data);
      } else if (activeTab === "users") {
        const data = await getAdminUsers();
        setUsers(data);
      } else if (activeTab === "photos") {
        const data = await getAdminPhotos();
        setPhotos(data);
      } else if (activeTab === "settings") {
        const data = await getAdminSettings();
        setSettings(data);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      await deleteAdminPhoto(id);
      setPhotos(photos.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePhotoElo = async (id, newElo) => {
    try {
      await updateAdminPhoto(id, { elo_rating: parseFloat(newElo) });
      setPhotos(photos.map(p => p.id === id ? { ...p, elo_rating: parseFloat(newElo) } : p));
      setEditingPhoto(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateUserRole = async (id, newRole) => {
    try {
      await updateAdminUserRole(id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      alert("User role updated!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateUserApproval = async (id, can_vote) => {
    try {
      await updateAdminUserApproval(id, can_vote);
      setUsers(users.map(u => u.id === id ? { ...u, can_vote } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user? This will also remove their photo and match history!")) return;
    try {
      await deleteAdminUser(id);
      setUsers(users.filter(u => u.id !== id));
      alert("User successfully deleted!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateLimit = async (e) => {
    e.preventDefault();
    const newLimit = e.target.limit.value;
    try {
      await updateAdminSetting("daily_vote_limit", newLimit);
      alert("Setting updated!");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const res = await uploadImage(file);
      setMessage(`Success! Uploaded to: ${res.url}`);
      setFile(null);
      document.getElementById("file-upload").value = "";
      if (activeTab === "photos") fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "1200px" }}>
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", background: "linear-gradient(to right, #fff, var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Admin Console
        </h1>
        
        <div className="admin-tabs" style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
          {["overview", "photos", "users", "settings"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "var(--primary)" : "transparent",
                color: activeTab === tab ? "#000" : "#fff",
                border: "1px solid var(--primary)",
                padding: "0.8rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "capitalize",
                transition: "all 0.3s ease"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="error-text" style={{ marginBottom: "1rem" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>Loading Dashboard...</div>
        ) : (
          <div className="admin-content">
            {activeTab === "overview" && stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                <StatCard title="Total Votes" value={stats.total_votes} icon="🔥" />
                <StatCard title="Active Users" value={stats.total_users} icon="👤" />
                <StatCard title="Real Photos (User)" value={stats.total_real_photos} icon="⭐" />
                <StatCard title="System Photos" value={stats.total_photos - stats.total_real_photos} icon="⚙️" />
                {stats.top_photo && (
                  <StatCard title="Top Rating" value={`${Math.round(stats.top_photo.elo_rating)}`} icon="🏆" subText={stats.top_photo.filename} />
                )}
              </div>
            )}

            {activeTab === "photos" && (
              <div>
                <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", background: "rgba(255,255,255,0.03)" }}>
                  <h3 style={{ marginBottom: "1rem" }}>Add New Photo</h3>
                  <form onSubmit={handleUpload} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input id="file-upload" type="file" onChange={(e) => setFile(e.target.files[0])} className="form-input" style={{ flex: 1 }} />
                    <button className="btn-primary" disabled={uploading || !file}>{uploading ? "Uploading..." : "Upload"}</button>
                  </form>
                  {message && <p style={{ color: "#10b981", marginTop: "0.5rem" }}>{message}</p>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {photos.map(p => (
                    <div key={p.id} className="glass-panel" style={{ padding: "0.5rem", position: "relative" }}>
                      <img src={p.image_url.startsWith("http") ? p.image_url : `http://127.0.0.1:8000${p.image_url}`} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" }} />
                      <div style={{ padding: "0.5rem" }}>
                        {editingPhoto === p.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <input 
                              type="number" 
                              defaultValue={Math.round(p.elo_rating)} 
                              onBlur={(e) => handleUpdatePhotoElo(p.id, e.target.value)}
                              autoFocus
                              className="form-input"
                              style={{ fontSize: "0.8rem", padding: "0.3rem" }}
                            />
                            <button onClick={() => setEditingPhoto(null)} style={{ fontSize: "0.7rem", background: "none", border: "none", color: "var(--primary)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <div onClick={() => setEditingPhoto(p.id)} style={{ cursor: "pointer" }}>
                            <p style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Rating: {Math.round(p.elo_rating)} ✏️</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Votes: {p.matches_played}</p>
                          </div>
                        )}
                        <button 
                          onClick={() => handleDeletePhoto(p.id)}
                          style={{ width: "100%", marginTop: "0.5rem", padding: "0.4rem", background: "rgba(255,75,75,0.2)", color: "#ff4b4b", border: "1px solid #ff4b4b", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="glass-panel" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th style={{ padding: "1rem" }}>Username</th>
                      <th style={{ padding: "1rem" }}>Email</th>
                      <th style={{ padding: "1rem" }}>Role</th>
                      <th style={{ padding: "1rem" }}>Approved</th>
                      <th style={{ padding: "1rem" }}>Joined</th>
                      <th style={{ padding: "1rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "1rem" }}>{u.username}</td>
                        <td style={{ padding: "1rem" }}>{u.email}</td>
                        <td style={{ padding: "1rem" }}>
                          <select 
                            value={u.role} 
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", padding: "0.2rem" }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <input 
                            type="checkbox" 
                            checked={u.can_vote} 
                            onChange={(e) => handleUpdateUserApproval(u.id, e.target.checked)}
                            style={{ width: "20px", height: "20px", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "1rem" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "1rem" }}>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ padding: "0.4rem 0.8rem", background: "rgba(255,75,75,0.2)", color: "#ff4b4b", border: "1px solid #ff4b4b", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="glass-panel" style={{ maxWidth: "500px" }}>
                <h3>Global Settings</h3>
                {settings.map(s => (
                  <div key={s.key} style={{ marginTop: "1.5rem" }}>
                    <form onSubmit={handleUpdateLimit} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      <label style={{ textTransform: "capitalize" }}>{s.key.replace(/_/g, " ")}</label>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <input name="limit" type="number" defaultValue={s.value} className="form-input" style={{ flex: 1 }} />
                        <button type="submit" className="btn-primary">Update</button>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subText }) {
  return (
    <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "2rem" }}>{icon}</span>
      <h4 style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{title}</h4>
      <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)" }}>{value}</p>
      {subText && <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{subText}</p>}
    </div>
  );
}
