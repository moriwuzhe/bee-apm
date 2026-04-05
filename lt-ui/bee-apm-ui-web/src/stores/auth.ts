import { defineStore } from 'pinia'

const LS_USER = 'ms_username'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    username: localStorage.getItem(LS_USER) || '',
  }),
  getters: {
    isAuthed: (s) => Boolean(s.username),
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

