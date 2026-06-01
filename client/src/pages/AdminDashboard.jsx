import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ userId: "", courseId: "" });
  const [perf, setPerf] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const params = {};
      if (filters.userId) params.userId = filters.userId;
      if (filters.courseId) params.courseId = filters.courseId;
      const [dashRes, perfRes] = await Promise.all([
        api.get("/admin/dashboard", { params }),
        api.get("/performance/hr")
      ]);
      setRows(dashRes.data.rows || []);
      setSummary(dashRes.data.summary || null);
      setPerf(perfRes.data.metrics || []);
    } catch (err) {
      setError(err.response?.data?.message || "加载失败");
    }
  }

  useEffect(() => {
    load();
  }, [filters.userId, filters.courseId]);

  useEffect(() => {
    const userMap = new Map();
    const courseMap = new Map();
    rows.forEach((r) => {
      userMap.set(r.user_id, r.user_name);
      courseMap.set(r.course_id, r.course_title);
    });
    setUsers(Array.from(userMap.entries()).map(([id, name]) => ({ id, name })));
    setCourses(Array.from(courseMap.entries()).map(([id, title]) => ({ id, title })));
  }, [rows]);

  const overdueCount = useMemo(
    () => rows.filter((r) => Number(r.is_overdue) === 1).length,
    [rows]
  );

  async function downloadExport() {
    const res = await api.get("/admin/export", { responseType: "blob" });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lms-report.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <header className="header">
        <h2>管理员后台</h2>
        <div>
          <span>{user?.name}</span>
          <button className="ghost" onClick={logout}>
            退出
          </button>
        </div>
      </header>

      {summary && (
        <div className="kpi-grid">
          <div className="kpi">总记录: {summary.total}</div>
          <div className="kpi">完成率: {summary.completionRate}%</div>
          <div className="kpi">已完成: {summary.completed}</div>
          <div className="kpi danger">逾期: {overdueCount}</div>
        </div>
      )}

      <div className="card">
        <div className="row">
          <select value={filters.userId} onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}>
            <option value="">按人员筛选</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select value={filters.courseId} onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}>
            <option value="">按课程筛选</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button onClick={downloadExport}>导出 Excel(CSV)</button>
        </div>
        {error && <div className="error">{error}</div>}
        <table>
          <thead>
            <tr>
              <th>学员</th>
              <th>课程</th>
              <th>进度</th>
              <th>成绩</th>
              <th>状态</th>
              <th>逾期</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.user_id}-${r.course_id}-${idx}`} className={r.is_overdue ? "row-danger" : ""}>
                <td>{r.user_name}</td>
                <td>{r.course_title}</td>
                <td>{Number(r.progress).toFixed(1)}%</td>
                <td>{Number(r.exam_score).toFixed(0)}</td>
                <td>{r.status}</td>
                <td>{r.is_overdue ? "是" : "否"}</td>
                <td>{r.admin_remark || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>绩效接口预览（HR）</h3>
        <table>
          <thead>
            <tr>
              <th>学员</th>
              <th>总课程</th>
              <th>完成</th>
              <th>未完成</th>
              <th>逾期</th>
              <th>完成率</th>
            </tr>
          </thead>
          <tbody>
            {perf.map((p) => (
              <tr key={p.user_id}>
                <td>{p.user_name}</td>
                <td>{p.total_courses}</td>
                <td>{p.completed_courses}</td>
                <td>{p.unfinished_courses}</td>
                <td>{p.overdue_courses}</td>
                <td>{p.completion_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
