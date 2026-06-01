import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

export default function ExamPage() {
  const { courseId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/exams/${courseId}/questions`)
      .then((res) => setQuestions(res.data.questions || []))
      .catch((err) => setError(err.response?.data?.message || "试题加载失败"));
  }, [courseId]);

  function setAnswer(questionId, option, multi) {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (!multi) return { ...prev, [questionId]: [option] };
      const exists = current.includes(option);
      const next = exists ? current.filter((x) => x !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }

  async function submit() {
    setError("");
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer
      }));
      const res = await api.post(`/exams/${courseId}/submit`, { answers: payload });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "提交失败");
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h2>课程考试</h2>
        <Link to={`/course/${courseId}`}>返回学习页</Link>
      </header>
      <div className="card">
        {error && <div className="error">{error}</div>}
        {questions.map((q, idx) => (
          <div key={q.id} className="question">
            <h4>
              {idx + 1}. {q.question} {q.type === "multi" ? "(多选)" : "(单选)"}
            </h4>
            {(q.options || []).map((op) => {
              const checked = (answers[q.id] || []).includes(op);
              return (
                <label key={op} className="option">
                  <input
                    type={q.type === "multi" ? "checkbox" : "radio"}
                    name={`q-${q.id}`}
                    checked={checked}
                    onChange={() => setAnswer(q.id, op, q.type === "multi")}
                  />
                  {op}
                </label>
              );
            })}
          </div>
        ))}
        {!!questions.length && (
          <button onClick={submit} className="full">
            提交考试
          </button>
        )}
        {result && (
          <div className="result">
            本次得分: {result.score}，最高分: {result.bestScore}，状态: {result.status}
          </div>
        )}
      </div>
    </div>
  );
}
