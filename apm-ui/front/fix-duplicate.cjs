const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src/services/api.ts');
let content = fs.readFileSync(apiPath, 'utf-8');

// 找到重复部分的起始位置（第二个const API_BASE_URL）
const duplicateStart = content.indexOf('\nconst API_BASE_URL = "http://localhost:8081/api";\n', 100);

if (duplicateStart !== -1) {
  // 删除从重复部分开始到文件末尾的内容
  content = content.substring(0, duplicateStart);
  fs.writeFileSync(apiPath, content, 'utf-8');
  console.log('Fixed duplicate code!');
} else {
  console.log('No duplicate found');
}
