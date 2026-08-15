import fs from 'fs';
import path from 'path';

try {
  const distDir = path.join(process.cwd(), 'dist');
  const staticDir = path.join(process.cwd(), 'backend', 'src', 'main', 'resources', 'static');

  if (fs.existsSync(distDir)) {
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    fs.rmSync(staticDir, { recursive: true, force: true });
    fs.cpSync(distDir, staticDir, { recursive: true });
    console.log('✅ Successfully copied dist/ assets to backend static directory');
  }
} catch (err) {
  console.log('⚠️ Copy assets note:', err.message);
}
