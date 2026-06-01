import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const nextUser = await login(name, password);
      navigate(nextUser.role === "admin" ? "/admin" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>企业视频学习管理系统</h1>
        <p className="muted">工程服务公司培训与行为管理</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="用户名" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
        />
        {error && <div className="error">{error}</div>}
        <button disabled={loading}>{loading ? "登录中..." : "登录"}</button>
        <div className="tip">
          默认账号: admin / Admin@123, student1 / Student@123
        </div>
      </form>
    </div>
  );
}
