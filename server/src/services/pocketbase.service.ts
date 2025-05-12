// src/services/pocketbase.service.ts
import PocketBase from 'pocketbase';

// Initialisation de PocketBase
export const pb = new PocketBase('http://127.0.0.1:8090');

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

export class AuthService {
  // Vérifier si l'utilisateur est déjà connecté
  async getCurrentUser(): Promise<User | null> {
    if (pb.authStore.isValid) {
      try {
        // Rafraîchir la session si nécessaire
        await pb.collection('users').authRefresh();
        const user = pb.authStore.model;
        
        if (!user) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar ? pb.files.getUrl(user, user.avatar) : undefined,
          preferences: user.preferences || {},
          watchlist: user.watchlist || []
        };
      } catch (error) {
        console.error('Error refreshing auth:', error);
        this.logout();
        return null;
      }
    }
    return null;
  }

  // Connexion utilisateur
  async login(email: string, password: string): Promise<User> {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      
      if (!authData.record) {
        throw new Error('Authentication failed');
      }
      
      return {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        avatar: authData.record.avatar ? pb.files.getUrl(authData.record, authData.record.avatar) : undefined,
        preferences: authData.record.preferences || {},
        watchlist: authData.record.watchlist || []
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Inscription utilisateur
  async register(name: string, email: string, password: string, passwordConfirm: string): Promise<User> {
    try {
      const userData = {
        email,
        password,
        passwordConfirm,
        name,
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

      const record = await pb.collection('users').create(userData);
      
      // Connecter automatiquement l'utilisateur après inscription
      await this.login(email, password);
      
      return {
        id: record.id,
        email: record.email,
        name: record.name,
        preferences: record.preferences,
        watchlist: record.watchlist
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Déconnexion
  logout() {
    pb.authStore.clear();
  }

  // Mettre à jour le profil
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    try {
      const record = await pb.collection('users').update(userId, data);
      
      return {
        id: record.id,
        email: record.email,
        name: record.name,
        avatar: record.avatar ? pb.files.getUrl(record, record.avatar) : undefined,
        preferences: record.preferences || {},
        watchlist: record.watchlist || []
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Ajouter une devise à la watchlist
  async addToWatchlist(userId: string, currencyId: string): Promise<string[]> {
    try {
      // Récupérer l'utilisateur actuel
      const user = await pb.collection('users').getOne(userId);
      
      // Récupérer ou initialiser la watchlist
      const watchlist = user.watchlist || [];
      
      // Ajouter la devise si elle n'est pas déjà présente
      if (!watchlist.includes(currencyId)) {
        watchlist.push(currencyId);
      }
      
      // Mettre à jour la watchlist
      await pb.collection('users').update(userId, { watchlist });
      
      return watchlist;
    } catch (error) {
      console.error('Add to watchlist error:', error);
      throw error;
    }
  }

  // Supprimer une devise de la watchlist
  async removeFromWatchlist(userId: string, currencyId: string): Promise<string[]> {
    try {
      // Récupérer l'utilisateur actuel
      const user = await pb.collection('users').getOne(userId);
      
      // Récupérer ou initialiser la watchlist
      let watchlist = user.watchlist || [];
      
      // Supprimer la devise si elle est présente
      watchlist = watchlist.filter(id => id !== currencyId);
      
      // Mettre à jour la watchlist
      await pb.collection('users').update(userId, { watchlist });
      
      return watchlist;
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();