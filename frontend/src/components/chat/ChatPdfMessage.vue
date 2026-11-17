<template>
    <div class="attached-file">
        <div class="attached-file-info">
            <img src="/icons/info.svg" alt="" />

            <div class="file-details">
                <strong>{{ document.name }}</strong>
            </div>
        </div>

        <button
            type="button"
            class="view-button"
            :aria-label="visible ? 'Ocultar documento' : 'Ver documento'"
            :title="visible ? 'Ocultar documento' : 'Ver documento'"
            @click="$emit('toggle-viewer')"
        >
            <img
                :src="visible ? '/icons/eye-off.svg' : '/icons/eye.svg'"
                alt=""
            />
        </button>
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
});

defineEmits(["toggle-viewer"]);
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

.view-button {
    display: flex;
    flex-shrink: 0;
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

.view-button:hover {
    border-color: #3f3f46;
    background: #27272a;
}

.view-button img {
    width: 16px;
    height: 16px;
}
</style>
