export const STATUS = {
  NOT_STARTED: "未开始",
  IN_PROGRESS: "学习中",
  COMPLETED: "已完成"
};

export function computeStatus(progress, examScore) {
  const p = Number(progress || 0);
  const e = Number(examScore || 0);
  if (p >= 90 && e >= 60) return STATUS.COMPLETED;
  if (p > 0) return STATUS.IN_PROGRESS;
  return STATUS.NOT_STARTED;
}

export function computeOverdue(deadline, status) {
  if (!deadline) return false;
  if (status === STATUS.COMPLETED) return false;
  return new Date(deadline).getTime() < Date.now();
}
