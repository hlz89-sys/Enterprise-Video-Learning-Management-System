import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mediaUrl } from "../api";

const EXTERNAL_REQUIRED_SECONDS = 600;

export default function CoursePlayerPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [externalPlaying, setExternalPlaying] = useState(false);
  const videoRef = useRef(null);
  const maxWatched = useRef(0);

  async function loadData() {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data.course);
      setRecord(res.data.record);
      maxWatched.current = Number(res.data.record?.watch_time || 0);
    } catch (err) {
      setError(err.response?.data?.message || "加载课程失败");
    }
  }

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function pushProgress(payload) {
    const res = await api.post(`/learning/${courseId}/progress`, payload);
    setRecord((prev) => ({
      ...(prev || {}),
      progress: res.data.progress,
      status: res.data.status,
      is_overdue: res.data.isOverdue
    }));
  }

  useEffect(() => {
    if (!course || course.type !== "external" || !externalPlaying) return;
    const timer = setInterval(async () => {
      const prev = Number(record?.watch_time || 0);
      const nextWatch = prev + 5;
      const progress = Math.min(100, (nextWatch / EXTERNAL_REQUIRED_SECONDS) * 100);
      try {
        await pushProgress({ watchTime: nextWatch, progress, position: nextWatch, duration: EXTERNAL_REQUIRED_SECONDS });
      } catch (err) {
        setError(err.response?.data?.message || "外链进度上报失败");
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [course, record, externalPlaying]);

  function handleSeeking() {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime > maxWatched.current + 2) {
      v.currentTime = maxWatched.current;
    }
  }

  async function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    maxWatched.current = Math.max(maxWatched.current, v.currentTime);
    try {
      await pushProgress({
        progress: (v.currentTime / v.duration) * 100,
        watchTime: Math.floor(maxWatched.current),
        position: v.currentTime,
        duration: v.duration
      });
    } catch (err) {
      setError(err.response?.data?.message || "进度上报失败");
    }
  }

  if (!course) return <div className="center">加载课程中...</div>;

  const progress = Number(record?.progress || 0);

  return (
    <div className="page">
      <header className="header">
        <h2>{course.title}</h2>
        <Link to="/student">返回课程列表</Link>
      </header>

      <div className="card">
        {course.type === "local" ? (
          <video
            ref={videoRef}
            controls
            width="100%"
            src={mediaUrl(course.video_url)}
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
          />
        ) : (
          <div>
            <iframe
              title={course.title}
              width="100%"
              height="480"
              src={course.video_url}
              allow="autoplay; encrypted-media"
            />
            <div className="row">
              <button onClick={() => setExternalPlaying((v) => !v)}>
                {externalPlaying ? "暂停计时" : "开始计时学习"}
              </button>
              <span className="muted">外链视频无法读取真实播放事件，采用页面计时策略并由后端校验</span>
            </div>
          </div>
        )}

        <div className="meter-wrap">
          <div className="meter" style={{ width: `${progress}%` }} />
        </div>
        <p>
          学习进度: <b>{progress.toFixed(1)}%</b> | 状态: <b>{record?.status || "未开始"}</b>
        </p>
        <div className="row">
          <Link to={`/exam/${course.id}`} className={progress >= 90 ? "btn-link" : "btn-link disabled"}>
            进入考试
          </Link>
          {progress < 90 && <span className="danger">进度不足 90%，禁止考试</span>}
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
