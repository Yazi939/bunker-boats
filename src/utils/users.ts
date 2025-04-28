// Типы пользователей
export type UserRole = 'admin' | 'moderator' | 'worker';

// Интерфейс пользователя
export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password: string;
}

// Права доступа по ролям
export const rolePermissions = {
  admin: {
    canEdit: true,
    canDelete: true,
    canFreeze: true,
    canAddUsers: true,
    canViewReports: true,
    canExport: true,
    canManageOrders: true,
    canManageShifts: true,
  },
  moderator: {
    canEdit: true,
    canDelete: false,
    canFreeze: true,
    canAddUsers: false,
    canViewReports: true, 
    canExport: true,
    canManageOrders: true,
    canManageShifts: true,
  },
  worker: {
    canEdit: false,
    canDelete: false,
    canFreeze: false,
    canAddUsers: false,
    canViewReports: false,
    canExport: false,
    canManageOrders: false,
    canManageShifts: false,
  }
};

// Инициализация пользователей
export const initializeUsers = (): void => {
  const users = localStorage.getItem('users');
  
  if (!users) {
    const defaultUsers: User[] = [
      {
        id: 'admin1',
        name: 'Администратор',
        role: 'admin',
        username: 'admin',
        password: 'admin123'
      },
      {
        id: 'moderator1',
        name: 'Модератор',
        role: 'moderator',
        username: 'moderator',
        password: 'mod123'
      },
      {
        id: 'worker1',
        name: 'Работник',
        role: 'worker',
        username: 'worker',
        password: 'worker123'
      }
    ];
    
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
  
  // Установка текущего пользователя, если не установлен
  if (!localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'admin1',
      name: 'Администратор',
      role: 'admin'
    }));
  }
};

// Авторизация пользователя
export const loginUser = (username: string, password: string): User | null => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find((u: User) => u.username === username && u.password === password);
  
  if (user) {
    const { id, name, role } = user;
    localStorage.setItem('currentUser', JSON.stringify({ id, name, role }));
    return user;
  }
  
  return null;
};

// Выход пользователя
export const logoutUser = (): void => {
  localStorage.removeItem('currentUser');
};

// Получение текущего пользователя
export const getCurrentUser = (): { id: string; name: string; role: UserRole } | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

// Проверка прав доступа
export const checkPermission = (permission: keyof typeof rolePermissions.admin): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  return rolePermissions[user.role][permission] || false;
}; 