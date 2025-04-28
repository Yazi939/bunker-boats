import { ipcRenderer } from 'electron';

class Store {
    private store: { [key: string]: any } = {};

    constructor() {
        // Загружаем данные при инициализации
        this.loadData();
    }

    private async loadData() {
        try {
            const data = await ipcRenderer.invoke('load-store-data');
            if (data) {
                this.store = data;
            }
        } catch (error) {
            console.error('Error loading store data:', error);
        }
    }

    async set(key: string, value: any) {
        this.store[key] = value;
        // Сохраняем данные при каждом изменении
        await ipcRenderer.invoke('save-store-data', this.store);
    }

    get(key: string) {
        return this.store[key];
    }

    async clear() {
        this.store = {};
        await ipcRenderer.invoke('save-store-data', this.store);
    }
}

export const store = new Store(); 