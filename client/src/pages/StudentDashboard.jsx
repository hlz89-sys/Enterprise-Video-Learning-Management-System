import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const { user, logout } = useAuth();

  async function fetchCourses() {
    const res = await api.get("/courses");
    setCourses(res.data.courses || []);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h2>学员中心</h2>
        <div>
          <span>{user?.name}</span>
          <button className="ghost" onClick={logout}>
            退出
          </button>
        </div>
      </header>

      <div className="card">
        <h3>我的课程</h3>
        <table>
          <thead>
            <tr>
              <th>课程</th>
              <th>进度</th>
              <th>成绩</th>
              <th>状态</th>
              <th>逾期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const progress = Number(c.progress || 0);
              const canExam = progress >= 90;
              return (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{progress.toFixed(1)}%</td>
                  <td>{Number(c.exam_score || 0)}</td>
                  <td>{c.status || "未开始"}</td>
                  <td className={c.is_overdue ? "danger" : ""}>{c.is_overdue ? "是" : "否"}</td>
                  <td>
                    <Link to={`/course/${c.id}`}>学习</Link>
                    {" | "}
                    {canExam ? (
                      <Link to={`/exam/${c.id}`}>考试</Link>
                    ) : (
                      <span className="muted">考试(需≥90%)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
