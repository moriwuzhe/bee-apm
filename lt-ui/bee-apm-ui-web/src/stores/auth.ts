import { defineStore } from 'pinia'

const LS_USER = 'beeapm_user'

export const useAuthStore = defineStore('auth', {
  state: () => {
    return {
      username: localStorage.getItem(LS_USER) || 'admin',
    }
  },
  getters: {
    isAuthed: (state) => Boolean(state.username),
  },
  actions: {
    login(username: string) {
      this.username = username
      localStorage.setItem(LS_USER, username)
    },
    logout() {
      this.username = ''
      localStorage.removeItem(LS_USER)
    },
  },
})

