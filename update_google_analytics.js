const fs = require('fs');
const path = require('path');

// 定义需要更新的目录
const directories = ['Action', 'BattleRoyale', 'FPS', 'Multiplayer', 'Sniper'];
const baseDir = __dirname;

// 新的谷歌分析代码
const newGoogleAnalyticsCode = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-F52E7VZMM8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-F52E7VZMM8');
</script>`;

// 旧的谷歌分析代码模式
const oldGoogleAnalyticsRegex = /<!-- Google tag \(gtag\.js\s*\)[\s\S]*?<\/script>\s*<\/script>/i;

directories.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 替换谷歌分析代码
        const updatedContent = content.replace(oldGoogleAnalyticsRegex, newGoogleAnalyticsCode);
        
        if (updatedContent !== content) {
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          console.log(`Updated Google Analytics code in ${filePath}`);
        }
      }
    });
  }
});

console.log('All files updated successfully!');