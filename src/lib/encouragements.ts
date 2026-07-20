// Encouragement lines shown when a kid completes a task.
// Mix of Chinese classical quotes and modern cheers.

export interface Encouragement {
  emoji: string;
  zh?: string;
  en: string;
}

const LINES: Encouragement[] = [
  { emoji: "✨", zh: "千里之行，始于足下", en: "Small steps, big journey!" },
  { emoji: "🌱", zh: "合抱之木，生于毫末", en: "Big trees start from tiny seeds!" },
  { emoji: "📚", zh: "学而时习之，不亦说乎", en: "Learning is joy!" },
  { emoji: "🌊", zh: "不积小流，无以成江海", en: "Every drop counts!" },
  { emoji: "🎯", zh: "有志者，事竟成", en: "Where there's a will, there's a way!" },
  { emoji: "🌟", zh: "温故而知新", en: "Old lessons, new insights!" },
  { emoji: "🔥", zh: "锲而不舍，金石可镂", en: "Never give up!" },
  { emoji: "💪", zh: "天道酬勤", en: "Hard work pays off!" },
  { emoji: "🌈", en: "Well done! Keep going!" },
  { emoji: "🎉", en: "One more done — awesome!" },
];

export function randomEncouragement(): Encouragement {
  return LINES[Math.floor(Math.random() * LINES.length)];
}

export const ALL_DONE: Encouragement = {
  emoji: "🏆",
  zh: "今日功课，圆满完成！",
  en: "All done for today — amazing!",
};

/** Small friendly line shown right after kid submits, before parent reviews. */
export const SUBMITTED_NUDGE: Encouragement = {
  emoji: "📝",
  zh: "任务提交啦，等家长检查",
  en: "Submitted — waiting for parent",
};
