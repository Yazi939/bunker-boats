import { ipcRenderer } from 'electron';
import { store } from './store';

export const syncData = async (dataType: string, data: any) => {
    try {
        // Сохраняем данные локально
        store.set(dataType, data);
        
        // Отправляем данные на сервер
        const response = await ipcRenderer.invoke('sync-data', {
            dataType,
            data
        });

        return response;
    } catch (error) {
        console.error('Sync error:', error);
        throw error;
    }
};

export const getSyncedData = async (dataType: string) => {
    try {
        // Получаем данные с сервера
        const serverData = await ipcRenderer.invoke('get-synced-data', dataType);
        
        if (serverData) {
            // Обновляем локальные данные
            store.set(dataType, serverData.data);
            return serverData.data;
        }

        // Если данных на сервере нет, возвращаем локальные
        return store.get(dataType);
    } catch (error) {
        console.error('Get synced data error:', error);
        // В случае ошибки возвращаем локальные данные
        return store.get(dataType);
    }
};

// Автоматическая синхронизация при изменении данных
export const setupAutoSync = () => {
    // Синхронизация при закрытии приложения
    window.addEventListener('beforeunload', async () => {
        const dataTypes = ['fuel', 'expenses', 'orders', 'shifts', 'users'];
        for (const type of dataTypes) {
            const data = store.get(type);
            if (data) {
                await syncData(type, data);
            }
        }
    });

    // Периодическая синхронизация (каждые 5 минут)
    setInterval(async () => {
        const dataTypes = ['fuel', 'expenses', 'orders', 'shifts', 'users'];
        for (const type of dataTypes) {
            const data = store.get(type);
            if (data) {
                await syncData(type, data);
            }
        }
    }, 5 * 60 * 1000);
}; 