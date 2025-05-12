// client/src/services/auth.service.ts
import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: {
    darkMode?: boolean;
    language?: string;
    notifications?: {
      email?: boolean;
      desktop?: boolean;
    }
  };
  watchlist?: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export const authService = {
  // Stocker l'utilisateur en mémoire
  user: null as User | null,

  register: async (data: RegisterRequest) => {
    try {
      // En développement, simuler une réponse réussie
      if (process.env.NODE_ENV === 'development' || !api.defaults.baseURL) {
        // Créer un utilisateur fictif
        const mockUser: User = {
          id: 'user_' + Date.now(),
          email: data.email,
          name: data.name,
          preferences: {
            darkMode: true,
            language: 'en',
            notifications: {
              email: true,
              desktop: true
            }
          },
          watchlist: []
        };
        
        // Stocker les infos utilisateur
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('accessToken', 'demo-token-' + mockUser.id);
        localStorage.setItem('refreshToken', 'demo-refresh-token-' + mockUser.id);
        
        // Mettre à jour l'utilisateur en mémoire
        authService.user = mockUser;
        
        return {
          user: mockUser,
          accessToken: 'demo-token-' + mockUser.id,
          refreshToken: 'demo-refresh-token-' + mockUser.id,
          message: 'Registration successful'
        };
      }
      
      // En production, appel API réel
      const response = await api.post<AuthResponse>('/auth/register', data);
      
      // Stocker les tokens et l'utilisateur
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Mettre à jour l'utilisateur en mémoire
      authService.user = response.data.user;
      
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  
  login: async (data: LoginRequest) => {
    try {
      // En développement, simuler une réponse réussie
      if (process.env.NODE_ENV === 'development' || !api.defaults.baseURL) {
        // Créer un utilisateur fictif
        const mockUser: User = {
          id: 'user_' + Date.now(),
          email: data.email,
          name: data.email.split('@')[0],
          preferences: {
            darkMode: true,
            language: 'en',
            notifications: {
              email: true,
              desktop: true
            }
          },
          watchlist: []
        };
        
        // Stocker les infos utilisateur
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('accessToken', 'demo-token-' + mockUser.id);
        localStorage.setItem('refreshToken', 'demo-refresh-token-' + mockUser.id);
        
        // Mettre à jour l'utilisateur en mémoire
        authService.user = mockUser;
        
        return {
          user: mockUser,
          accessToken: 'demo-token-' + mockUser.id,
          refreshToken: 'demo-refresh-token-' + mockUser.id,
          message: 'Login successful'
        };
      }
      
      // En production, appel API réel
      const response = await api.post<AuthResponse>('/auth/login', data);
      
      // Stocker les tokens et l'utilisateur
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Mettre à jour l'utilisateur en mémoire
      authService.user = response.data.user;
      
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
  
  logout: () => {
    // Supprimer les données d'authentification
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Réinitialiser l'utilisateur en mémoire
    authService.user = null;
  },
  
  getProfile: async () => {
    try {
      // En développement, charger depuis le stockage local
      if (process.env.NODE_ENV === 'development' || !api.defaults.baseURL) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr) as User;
          authService.user = user;
          return { user };
        }
        return { user: null };
      }
      
      // En production, appel API réel
      const response = await api.get('/auth/profile');
      
      // Mettre à jour l'utilisateur en mémoire
      authService.user = response.data.user;
      
      return response.data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
  
  getCurrentUser: (): User | null => {
    // Si l'utilisateur est déjà en mémoire, le retourner
    if (authService.user) {
      return authService.user;
    }
    
    // Sinon, essayer de le charger depuis le stockage local
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        authService.user = user;
        return user;
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        // Supprimer les données corrompues
        localStorage.removeItem('user');
        return null;
      }
    }
    
    return null;
  },
  
  // Pour la gestion de la watchlist
  addToWatchlist: async (currencyId: string): Promise<string[]> => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // En développement, mettre à jour localement
      if (process.env.NODE_ENV === 'development' || !api.defaults.baseURL) {
        const watchlist = user.watchlist || [];
        if (!watchlist.includes(currencyId)) {
          watchlist.push(currencyId);
        }
        
        // Mettre à jour l'utilisateur
        user.watchlist = watchlist;
        authService.user = user;
        
        // Mettre à jour le stockage local
        localStorage.setItem('user', JSON.stringify(user));
        
        return watchlist;
      }
      
      // En production, appel API réel
      const response = await api.post(`/user/watchlist/add/${currencyId}`);
      
      // Mettre à jour l'utilisateur en mémoire
      if (authService.user) {
        authService.user.watchlist = response.data.watchlist;
        localStorage.setItem('user', JSON.stringify(authService.user));
      }
      
      return response.data.watchlist;
    } catch (error) {
      console.error("Add to watchlist error:", error);
      throw error;
    }
  },
  
  removeFromWatchlist: async (currencyId: string): Promise<string[]> => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // En développement, mettre à jour localement
      if (process.env.NODE_ENV === 'development' || !api.defaults.baseURL) {
        const watchlist = user.watchlist || [];
        const updatedWatchlist = watchlist.filter(id => id !== currencyId);
        
        // Mettre à jour l'utilisateur
        user.watchlist = updatedWatchlist;
        authService.user = user;
        
        // Mettre à jour le stockage local
        localStorage.setItem('user', JSON.stringify(user));
        
        return updatedWatchlist;
      }
      
      // En production, appel API réel
      const response = await api.post(`/user/watchlist/remove/${currencyId}`);
      
      // Mettre à jour l'utilisateur en mémoire
      if (authService.user) {
        authService.user.watchlist = response.data.watchlist;
        localStorage.setItem('user', JSON.stringify(authService.user));
      }
      
      return response.data.watchlist;
    } catch (error) {
      console.error("Remove from watchlist error:", error);
      throw error;
    }
  },
  
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // En développement, mettre à jour localement
      if (process.env.NODE_ENV === 'development' || !api.defaults.baseURL) {
        // Mettre à jour l'utilisateur
        const updatedUser = { ...user, ...userData };
        authService.user = updatedUser;
        
        // Mettre à jour le stockage local
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return updatedUser;
      }
      
      // En production, appel API réel
      const response = await api.put(`/user/profile`, userData);
      
      // Mettre à jour l'utilisateur en mémoire
      if (response.data.user) {
        authService.user = response.data.user;
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data.user;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }
};