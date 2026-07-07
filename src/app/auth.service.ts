import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Profile {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  profileId: string;
  profile?: Profile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  profiles = signal<Profile[]>([]);
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);

  sessionReady: Promise<void>;

  constructor() {
    this.sessionReady = this.checkSession();
  }

  get currentProfile(): Profile | null {
    const user = this.currentUser();
    if (!user) return null;
    return user.profile || null;
  }

  hasPermission(section: string): boolean {
    const profile = this.currentProfile;
    if (!profile) return false;
    if (profile.permissions.includes('all')) return true;
    return profile.permissions.includes(section);
  }

  async checkSession() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('cobranza_token');
    if (token) {
      try {
        const user = await firstValueFrom(this.http.get<User>('/api/me'));
        this.currentUser.set(user);
        this.loadUsersAndProfiles();
      } catch (e) {
        localStorage.removeItem('cobranza_token');
        this.currentUser.set(null);
      }
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.post<{token: string, user: User}>('/api/login', { username, password }));
      localStorage.setItem('cobranza_token', res.token);
      this.currentUser.set(res.user);
      this.loadUsersAndProfiles();
      return true;
    } catch (e) {
      return false;
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cobranza_token');
    }
    this.currentUser.set(null);
    this.profiles.set([]);
    this.users.set([]);
  }

  async loadUsersAndProfiles() {
    try {
      const [profiles, users] = await Promise.all([
        firstValueFrom(this.http.get<Profile[]>('/api/profiles')),
        firstValueFrom(this.http.get<User[]>('/api/users'))
      ]);
      this.profiles.set(profiles);
      this.users.set(users);
    } catch (e) {
      console.error('Error loading users/profiles', e);
    }
  }

  async addProfile(profile: Omit<Profile, 'id'>) {
    await firstValueFrom(this.http.post('/api/profiles', profile));
    await this.loadUsersAndProfiles();
  }

  async updateProfile(id: string, updates: Partial<Profile>) {
    await firstValueFrom(this.http.put(`/api/profiles/${id}`, updates));
    await this.loadUsersAndProfiles();
  }

  async deleteProfile(id: string) {
    await firstValueFrom(this.http.delete(`/api/profiles/${id}`));
    await this.loadUsersAndProfiles();
  }

  async addUser(user: Omit<User, 'id'>) {
    await firstValueFrom(this.http.post('/api/users', user));
    await this.loadUsersAndProfiles();
  }

  async updateUser(id: string, updates: Partial<User>) {
    await firstValueFrom(this.http.put(`/api/users/${id}`, updates));
    await this.loadUsersAndProfiles();
  }

  async deleteUser(id: string) {
    await firstValueFrom(this.http.delete(`/api/users/${id}`));
    await this.loadUsersAndProfiles();
  }
}
