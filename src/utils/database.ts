/**
 * Утилиты для работы с локальным хранилищем как с базой данных
 * В будущем может быть заменено на настоящую БД или IndexedDB
 */

/**
 * Сохраняет данные в localStorage
 * @param key Ключ для сохранения
 * @param data Данные для сохранения
 */
export const saveData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Ошибка при сохранении данных ${key}:`, error);
  }
};

/**
 * Загружает данные из localStorage
 * @param key Ключ для загрузки
 * @param defaultValue Значение по умолчанию, если данных нет
 * @returns Загруженные данные или значение по умолчанию
 */
export const loadData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Ошибка при загрузке данных ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Удаляет данные из localStorage
 * @param key Ключ для удаления
 */
export const removeData = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Ошибка при удалении данных ${key}:`, error);
  }
};

/**
 * Очищает все данные из localStorage
 */
export const clearAllData = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Ошибка при очистке всех данных:', error);
  }
};

/**
 * Генерирует уникальный ID
 * @returns Уникальный ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * Класс имитирующий работу с таблицей базы данных
 */
export class DBTable<T extends { id: string }> {
  private storageKey: string;
  
  constructor(tableName: string) {
    this.storageKey = `db_table_${tableName}`;
  }
  
  /**
   * Получить все записи
   */
  getAll(): T[] {
    return loadData<T[]>(this.storageKey, []);
  }
  
  /**
   * Получить запись по ID
   * @param id ID записи
   */
  getById(id: string): T | undefined {
    const items = this.getAll();
    return items.find(item => item.id === id);
  }
  
  /**
   * Добавить запись
   * @param item Запись для добавления
   */
  add(item: T): void {
    const items = this.getAll();
    items.push(item);
    saveData(this.storageKey, items);
  }
  
  /**
   * Обновить запись
   * @param id ID записи
   * @param newData Новые данные
   */
  update(id: string, newData: Partial<T>): boolean {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    items[index] = { ...items[index], ...newData };
    saveData(this.storageKey, items);
    return true;
  }
  
  /**
   * Удалить запись
   * @param id ID записи
   */
  remove(id: string): boolean {
    const items = this.getAll();
    const newItems = items.filter(item => item.id !== id);
    
    if (newItems.length === items.length) return false;
    
    saveData(this.storageKey, newItems);
    return true;
  }
  
  /**
   * Заменить все записи
   * @param items Новые записи
   */
  setAll(items: T[]): void {
    saveData(this.storageKey, items);
  }
  
  /**
   * Очистить таблицу
   */
  clear(): void {
    saveData(this.storageKey, []);
  }
}

/**
 * Инициализирует базу данных с тестовыми данными, если она пуста
 */
export const initializeDatabase = (): void => {
  // Функция для инициализации демонстрационных данных
  // Будет вызываться при первом запуске приложения
  
  // Проверка, инициализирована ли уже БД
  if (localStorage.getItem('db_initialized')) {
    return;
  }
  
  // Отметка, что БД инициализирована
  localStorage.setItem('db_initialized', 'true');
}; 