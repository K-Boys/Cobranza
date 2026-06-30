import { Injectable, signal } from '@angular/core';

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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  profiles = signal<Profile[]>([]);
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);
  currentProfileSignal = signal<Profile | null>(null);

  constructor() {
    this.loadState();
    this.fetchProfiles();
    this.fetchUsers();
  }

  get currentProfile(): Profile | null {
    // Return from signal which has cached version or latest
    return this.currentProfileSignal();
  }

  hasPermission(section: string): boolean {
    const cp = this.currentProfile;
    if (!cp) return false;
    if (cp.permissions.includes('all')) return true;
    return cp.permissions.includes(section);
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    const userBytes = localStorage.getItem('cobranza_current_user');
    const profileBytes = localStorage.getItem('cobranza_current_profile');
    if (userBytes) {
      try {
        this.currentUser.set(JSON.parse(userBytes));
      } catch (e) {
        console.error(e);
      }
    }
    if (profileBytes) {
      try {
        this.currentProfileSignal.set(JSON.parse(profileBytes));
      } catch (e) {
        console.error(e);
      }
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    if (this.currentUser()) {
        localStorage.setItem('cobranza_current_user', JSON.stringify(this.currentUser()));
    } else {
        localStorage.removeItem('cobranza_current_user');
    }
    if (this.currentProfileSignal()) {
        localStorage.setItem('cobranza_current_profile', JSON.stringify(this.currentProfileSignal()));
    } else {
        localStorage.removeItem('cobranza_current_profile');
    }
  }

  async fetchProfiles() {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        this.profiles.set(data);
        // Update current profile if we have one
        const user = this.currentUser();
        if (user) {
          const p = data.find((x: Profile) => x.id === user.profileId);
          if (p) {
             this.currentProfileSignal.set(p);
             this.saveState();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async fetchUsers() {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        this.users.set(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser.set(data.user);
        this.currentProfileSignal.set(data.profile);
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    this.currentProfileSignal.set(null);
    this.saveState();
  }

  async addProfile(profile: Omit<Profile, 'id'>) {
    // Generate UUID locally or let db do it? DB schema expects a string. Let's send a UUID.
    const newProfile = { ...profile, id: crypto.randomUUID() };
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        this.fetchProfiles();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async updateProfile(id: string, updates: Partial<Profile>) {
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        this.fetchProfiles();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async deleteProfile(id: string) {
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        this.fetchProfiles();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async addUser(user: Omit<User, 'id'>) {
    const newUser = { ...user, id: crypto.randomUUID() };
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        this.fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async updateUser(id: string, updates: Partial<User>) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        this.fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async deleteUser(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        this.fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  }
}
