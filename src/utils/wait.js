// ES модуль для создания задержки
export default function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    setTimeout(() => {
        process.exit(0);
    }, 5000);
} 