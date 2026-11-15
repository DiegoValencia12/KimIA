<template>
    <Teleport to="body">
        <Transition name="dialog">
            <div
                v-if="confirmation.visible"
                class="confirmation-overlay"
                @click.self="confirmation.cancel()"
            >
                <div
                    class="confirmation-dialog"
                    role="alertdialog"
                    aria-modal="true"
                >
                    <div class="dialog-header">
                        <div class="dialog-icon">?</div>

                        <h3>{{ confirmation.title }}</h3>
                    </div>

                    <div class="dialog-content">
                        <p>{{ confirmation.message }}</p>
                    </div>

                    <div class="dialog-actions">
                        <button
                            class="dialog-button cancel-button"
                            @click="confirmation.cancel()"
                        >
                            Cancelar
                        </button>

                        <button
                            class="dialog-button accept-button"
                            @click="confirmation.accept()"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { useConfirmationStore } from "@/stores/confirmationStore";

const confirmation = useConfirmationStore();
</script>

<style scoped>
.confirmation-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(3px);
}

.confirmation-dialog {
    width: 100%;
    max-width: 400px;
    padding: 22px;
    border: 1px solid #3f3f46;
    border-radius: 12px;
    background: #18181b;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
}

.dialog-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border: 1px solid #3730a3;
    border-radius: 50%;
    background: #312e81;
    color: #a5b4fc;
    font-size: 19px;
    font-weight: 700;
}

.dialog-header h3 {
    margin: 0;
    color: #fafafa;
    font-size: 15px;
    font-weight: 650;
}

.dialog-content {
    margin-bottom: 25px;
}

.dialog-content p {
    margin: 0;
    color: #a1a1aa;
    font-size: 13px;
    line-height: 1.7;
    overflow-wrap: anywhere;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
}

.dialog-button {
    min-width: 90px;
    height: 36px;
    padding: 0 15px;
    border: 1px solid transparent;
    border-radius: 7px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-button {
    border-color: #3f3f46;
    background: #27272a;
    color: #d4d4d8;
}

.cancel-button:hover {
    background: #3f3f46;
    color: #fafafa;
}

.accept-button {
    background: #4338ca;
    color: #ffffff;
}

.accept-button:hover {
    background: #4f46e5;
}

.dialog-enter-active,
.dialog-leave-active {
    transition: opacity 0.2s ease;
}

.dialog-enter-active .confirmation-dialog,
.dialog-leave-active .confirmation-dialog {
    transition: transform 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
    opacity: 0;
}

.dialog-enter-from .confirmation-dialog,
.dialog-leave-to .confirmation-dialog {
    transform: scale(0.95) translateY(8px);
}
</style>
