const fs = require('fs');
const files = [
  'app/student/error.tsx',
  'app/student/practice/error.tsx',
  'app/student/progress/error.tsx',
  'app/student/results/error.tsx',
  'app/teacher/error.tsx',
  'app/teacher/reports/error.tsx',
  'app/teacher/review/error.tsx',
  'app/teacher/students/error.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s*\{\s*ErrorState\s*\}\s*from\s*'@\/components\/ui\/ErrorState'/g, `import { ErrorState } from '@/components/ui'`);
  content = content.replace(/<ErrorState\s+title="([^"]+)"\s+message="([^"]+)"\s+onRetry=\{([^}]+)\}\s*\/>/g, `<ErrorState theme="light" title="$1" body="$2" primaryAction={{ label: 'Try again', onClick: $3 }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />`);
  fs.writeFileSync(f, content);
  console.log('Updated ' + f);
});
