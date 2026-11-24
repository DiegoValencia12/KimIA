<template>
    <div class="attached-file">
        <div class="attached-file-info">
            <img src="/icons/info.svg" alt="" />

            <div class="file-details">
                <strong>{{ document.name }}</strong>
            </div>
        </div>

        <div class="attached-file-actions">
            <button
                type="button"
                class="action-button view-button"
                :aria-label="visible ? 'Ocultar documento' : 'Ver documento'"
                :title="visible ? 'Ocultar documento' : 'Ver documento'"
                @click="$emit('toggle-viewer')"
            >
                <img
                    :src="visible ? '/icons/eye-off.svg' : '/icons/eye.svg'"
                    alt=""
                />
            </button>

            <button
                v-if="removable"
                type="button"
                class="action-button remove-button"
                aria-label="Quitar documento"
                title="Quitar documento"
                @click="$emit('remove')"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
defineProps({
    document: {
        type: Object,
        required: true,
    },
    visible: {
        type: Boolean,
        default: false,
    },
    removable: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["toggle-viewer", "remove"]);
</script>

<style scoped>
.attached-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    padding: 10px 12px;
    border: 1px solid #3f3f46;
    border-radius: 9px;
    background: #18181b;
}

.attached-file-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.attached-file-info > img {
    flex-shrink: 0;
    width: 21px;
    height: 21px;
}

.file-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.file-details strong {
    overflow: hidden;
    color: #fafafa;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.attached-file-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 6px;
}

.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-button img {
    width: 16px;
    height: 16px;
}

.view-button:hover {
    border-color: #3f3f46;
    background: #27272a;
}

.remove-button {
    color: #a1a1aa;
}

.remove-button:hover {
    border-color: #7f1d1d;
    background: #271313;
    color: #fca5a5;
}

.remove-button:active {
    transform: scale(0.94);
}
</style>
