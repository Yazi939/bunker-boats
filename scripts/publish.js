const { publish } = require('electron-builder');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function publishUpdate() {
  try {
    // Получаем текущую версию из package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    // Собираем приложение
    console.log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Публикуем релиз
    console.log('Publishing release...');
    await publish({
      provider: 'github',
      owner: 'Yazi939',
      repo: 'bunker-boats',
      private: false,
      releaseType: 'release',
      publish: 'always'
    });

    console.log(`Successfully published version ${version}`);
  } catch (error) {
    console.error('Error publishing update:', error);
    process.exit(1);
  }
}

publishUpdate(); 