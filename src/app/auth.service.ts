import { Injectable, signal } from '@angular/core';

export interface Profile {
  id: string;
  name: string;
  permissions: string[]; // clients, delays, routes, supplies, financial, reports, users
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  profileId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  profiles = signal<Profile[]>([]);
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);

  constructor() {
    this.loadState();
    if (this.users().length === 0) {
      this.initDefaultAdmin();
    }
  }

  get currentProfile(): Profile | null {
    const user = this.currentUser();
    if (!user) return null;
    return this.profiles().find(p => p.id === user.profileId) || null;
  }

  hasPermission(section: string): boolean {
    if (!this.currentProfile) return false;
    // Admins implicitly have access to everything if 'admin' is their profile name, or they have 'users'
    if (this.currentProfile.permissions.includes('all')) return true;
    return this.currentProfile.permissions.includes(section);
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem('cobranza_auth');
    if (data) {
      const parsed = JSON.parse(data);
      this.profiles.set(parsed.profiles || []);
      this.users.set(parsed.users || []);
      const userBytes = localStorage.getItem('cobranza_current_user');
      if (userBytes) {
        this.currentUser.set(JSON.parse(userBytes));
      }
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cobranza_auth', JSON.stringify({
      profiles: this.profiles(),
      users: this.users()
    }));
    if (this.currentUser()) {
        localStorage.setItem('cobranza_current_user', JSON.stringify(this.currentUser()));
    } else {
        localStorage.removeItem('cobranza_current_user');
    }
  }

  initDefaultAdmin() {
    const adminProfile: Profile = {
      id: crypto.randomUUID(),
      name: 'Administrador',
      permissions: ['clients', 'delays', 'routes', 'supplies', 'financial', 'reports', 'users']
    };
    const adminUser: User = {
      id: crypto.randomUUID(),
      name: 'Admin Principal',
      username: 'admin',
      password: '123',
      profileId: adminProfile.id
    };
    this.profiles.set([adminProfile]);
    this.users.set([adminUser]);
    this.saveState();
  }

  login(username: string, password: string):boolean {
    const user = this.users().find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser.set(user);
      this.saveState();
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    this.saveState();
  }

  addProfile(profile: Omit<Profile, 'id'>) {
    const newProfile = { ...profile, id: crypto.randomUUID() };
    this.profiles.update(p => [...p, newProfile]);
    this.saveState();
  }

  updateProfile(id: string, updates: Partial<Profile>) {
    this.profiles.update(p => p.map(pr => pr.id === id ? { ...pr, ...updates } : pr));
    this.saveState();
  }

  deleteProfile(id: string) {
    this.profiles.update(p => p.filter(pr => pr.id !== id));
    this.saveState();
  }

  addUser(user: Omit<User, 'id'>) {
    const newUser = { ...user, id: crypto.randomUUID() };
    this.users.update(u => [...u, newUser]);
    this.saveState();
  }

  updateUser(id: string, updates: Partial<User>) {
    this.users.update(u => u.map(user => user.id === id ? { ...user, ...updates } : user));
    this.saveState();
  }

  deleteUser(id: string) {
    this.users.update(u => u.filter(user => user.id !== id));
    this.saveState();
  }
}
