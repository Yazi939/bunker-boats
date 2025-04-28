using System;
using System.Diagnostics;
using System.IO;

namespace FuelAppLauncher
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                // Получаем путь к директории, где находится exe файл
                string exePath = AppDomain.CurrentDomain.BaseDirectory;
                
                // Путь к start.bat относительно exe файла
                string batPath = Path.Combine(exePath, "..", "scripts", "windows", "start.bat");
                
                // Проверяем существование файла
                if (!File.Exists(batPath))
                {
                    Console.WriteLine("Ошибка: файл start.bat не найден!");
                    Console.WriteLine($"Искомый путь: {batPath}");
                    Console.WriteLine("Нажмите любую клавишу для выхода...");
                    Console.ReadKey();
                    return;
                }

                // Создаем процесс для запуска bat файла
                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c \"{batPath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.GetDirectoryName(batPath)
                };

                // Запускаем процесс
                using (Process process = Process.Start(startInfo))
                {
                    // Выводим вывод в консоль
                    process.OutputDataReceived += (sender, e) => Console.WriteLine(e.Data);
                    process.ErrorDataReceived += (sender, e) => Console.WriteLine(e.Data);
                    
                    process.BeginOutputReadLine();
                    process.BeginErrorReadLine();
                    
                    process.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Произошла ошибка: {ex.Message}");
                Console.WriteLine("Нажмите любую клавишу для выхода...");
                Console.ReadKey();
            }
        }
    }
} 