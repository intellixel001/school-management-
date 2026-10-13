export function checkIsCorrect(q: any, studentAns: any): boolean {
  if (studentAns === undefined || studentAns === null) return false
  
  // MCQ Multi logic
  if (Array.isArray(q.correctAnswer)) {
    if (!Array.isArray(studentAns)) return false
    const a = new Set<string>(q.correctAnswer.map((s: any) => String(s).toUpperCase()))
    const b = new Set<string>(studentAns.map((s: any) => String(s).toUpperCase()))
    return a.size === b.size && [...a].every((x: string) => b.has(x))
  }
  
  if (typeof studentAns !== 'string') return false
  
  // Reading short-answer word count constraint
  if (q.maxWords) {
    const words = studentAns.trim().split(/\s+/).filter(Boolean)
    if (words.length > q.maxWords) return false
  }

  return studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
}

export function formatAnswer(ans: any): string {
  if (ans === undefined || ans === null) return '—'
  if (Array.isArray(ans)) return ans.join(', ')
  return String(ans)
}
