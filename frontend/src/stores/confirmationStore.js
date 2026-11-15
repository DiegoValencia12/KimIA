
import { defineStore } from 'pinia'

export const useConfirmationStore = defineStore('confirmation', {
  state: () => ({
    visible: false,
    title: 'Confirmación',
    message: '',
    resolve: null
  }),

  actions: {
    confirm({ title = 'Confirmación', message }) {
      if (this.resolve) {
        this.resolve(false)
      }

      this.title = title
      this.message = message
      this.visible = true

      return new Promise((resolve) => {
        this.resolve = resolve
      })
    },

    accept() {
      this.finish(true)
    },

    cancel() {
      this.finish(false)
    },

    finish(result) {
      const resolve = this.resolve

      this.visible = false
      this.resolve = null

      if (resolve) {
        resolve(result)
      }
    }
  }
})
