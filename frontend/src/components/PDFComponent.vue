<template>
    <div ref="viewerContainer" class="pdf-component">
        <div class="pdf-toolbar">
            <div class="pdf-navigation">
                <button
                    type="button"
                    class="toolbar-button"
                    :disabled="!loaded || currentPage <= 1"
                    title="Página anterior"
                    aria-label="Página anterior"
                    @click="previousPage"
                >
                    <img src="/icons/arrow-left.svg" alt="" />
                </button>

                <div class="page-counter">
                    <input
                        v-model.number="pageInput"
                        type="number"
                        min="1"
                        :max="totalPages"
                        :disabled="!loaded"
                        aria-label="Número de página"
                        @change="goToPage"
                        @keyup.enter="goToPage"
                    />
                    <span>/ {{ totalPages || "--" }}</span>
                </div>

                <button
                    type="button"
                    class="toolbar-button"
                    :disabled="!loaded || currentPage >= totalPages"
                    title="Página siguiente"
                    aria-label="Página siguiente"
                    @click="nextPage"
                >
                    <img src="/icons/arrow-right.svg" alt="" />
                </button>
            </div>

            <div class="pdf-zoom">
                <button
                    type="button"
                    class="toolbar-button"
                    :disabled="zoom <= 0.5"
                    title="Alejar"
                    aria-label="Alejar"
                    @click="zoomOut"
                >
                    <img src="/icons/zoom-out.svg" alt="" />
                </button>
                <span>{{ Math.round(zoom * 100) }}%</span>
                <button
                    type="button"
                    class="toolbar-button"
                    :disabled="zoom >= 2"
                    title="Acercar"
                    aria-label="Acercar"
                    @click="zoomIn"
                >
                    <img src="/icons/zoom-in.svg" alt="" />
                </button>
            </div>

            <div class="pdf-actions">
                <button
                    type="button"
                    class="toolbar-button"
                    title="Descargar PDF"
                    aria-label="Descargar PDF"
                    :disabled="!document"
                    @click="downloadPdf"
                >
                    <img src="/icons/download.svg" alt="" />
                </button>
                <button
                    type="button"
                    class="toolbar-button"
                    title="Pantalla completa"
                    aria-label="Pantalla completa"
                    @click="toggleFullscreen"
                >
                    <img src="/icons/full-screen.svg" alt="" />
                </button>
            </div>
        </div>

        <div ref="scrollContainer" class="pdf-scroll-container">
            <div v-if="!document" class="pdf-empty">
                <img src="/icons/warning.svg" alt="" />
                <p>No hay ningún documento seleccionado.</p>
            </div>

            <div v-else class="pdf-render-area">
                <div class="pdf-page">
                    <VuePdfEmbed
                        :key="document.id"
                        :source="renderedSource"
                        :page="currentPage"
                        :width="renderedWidth"
                        @loaded="handleLoaded"
                        @rendered="handleRendered"
                        @loading-failed="handleLoadingFailed"
                        @error="handleLoadingFailed"
                    />
                </div>

                <!-- Rueda de carga -->
                <div v-if="loading" class="pdf-overlay">
                    <div class="loading-spinner"></div>
                    <p>Cargando documento...</p>
                </div>

                <div v-if="loadError" class="pdf-overlay pdf-error">
                    <img src="/icons/error.svg" alt="" />
                    <p>{{ loadError }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from "vue";

import VuePdfEmbed from "vue-pdf-embed";

const props = defineProps({
    documents: {
        type: Array,
        default: () => [],
    },
});

const viewerContainer = ref(null);
const scrollContainer = ref(null);

const document = ref(null);

const currentPage = ref(1);
const pageInput = ref(1);
const totalPages = ref(0);

const zoom = ref(1);
const availableWidth = ref(0);

const loading = ref(false);
const loaded = ref(false);
const loadError = ref("");

let resizeObserver = null;

// Copia fresca del Uint8Array para evitar que pdf.js lo detache al ocultar/mostrar
const renderedSource = computed(() => {
    if (!document.value?.source) return undefined;
    if (document.value.source instanceof Uint8Array) {
        return new Uint8Array(document.value.source);
    }
    return document.value.source;
});

const renderedWidth = computed(() => {
    const width = availableWidth.value || 800;
    return Math.max(200, Math.floor(width * zoom.value));
});

watch(
    () => props.documents,
    (documents) => {
        const nextDocument = documents?.[0] || null;
        document.value = nextDocument;

        currentPage.value = 1;
        pageInput.value = 1;
        totalPages.value = 0;

        zoom.value = 1;
        loaded.value = false;
        loading.value = Boolean(nextDocument);
        loadError.value = "";
    },
    { immediate: true, deep: true },
);

watch(currentPage, (page) => {
    pageInput.value = page;
    if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0;
    }
});

onMounted(async () => {
    await nextTick();
    updateAvailableWidth();

    if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
            updateAvailableWidth();
        });
        if (scrollContainer.value) {
            resizeObserver.observe(scrollContainer.value);
        }
    }
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
});

function updateAvailableWidth() {
    if (!scrollContainer.value) return;
    availableWidth.value = scrollContainer.value.clientWidth - 32;
}

function handleLoaded(pdfDocument) {
    if (pdfDocument?.numPages) {
        totalPages.value = pdfDocument.numPages;
    } else if (!totalPages.value) {
        totalPages.value = 1;
    }
    loading.value = false;
    loaded.value = true;
    loadError.value = "";
}

function handleRendered() {
    loading.value = false;
    loaded.value = true;
    if (!totalPages.value) totalPages.value = 1;
}

function handleLoadingFailed(error) {
    console.error("Error real de pdfjs:", error);
    loading.value = false;
    loaded.value = false;
    loadError.value = "No fue posible cargar este documento PDF.";
}

function previousPage() {
    if (currentPage.value <= 1) return;
    currentPage.value--;
}

function nextPage() {
    if (currentPage.value >= totalPages.value) return;
    currentPage.value++;
}

function goToPage() {
    const requestedPage = Number(pageInput.value);
    if (!Number.isFinite(requestedPage)) {
        pageInput.value = currentPage.value;
        return;
    }
    currentPage.value = Math.min(
        totalPages.value || 1,
        Math.max(1, Math.floor(requestedPage)),
    );
}

function zoomIn() {
    zoom.value = Math.min(2, Number((zoom.value + 0.1).toFixed(2)));
}

function zoomOut() {
    zoom.value = Math.max(0.5, Number((zoom.value - 0.1).toFixed(2)));
}

function downloadPdf() {
    if (!document.value) return;
    const link = window.document.createElement("a");

    if (document.value.file) {
        const url = URL.createObjectURL(document.value.file);
        link.href = url;
        link.download = document.value.name || "documento.pdf";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
    }
}

async function toggleFullscreen() {
    const element = viewerContainer.value;
    if (!element) return;

    try {
        if (!window.document.fullscreenElement) {
            await element.requestFullscreen();
        } else {
            await window.document.exitFullscreen();
        }
    } catch (error) {
        console.error("No fue posible cambiar pantalla completa:", error);
    }
}
</script>

<style scoped>
.pdf-component {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: #111113;
}

.pdf-toolbar {
    display: flex;
    flex: 0 0 48px;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 10px;
    box-sizing: border-box;
    border-bottom: 1px solid #27272a;
    background: #18181b;
    z-index: 20;
}

.pdf-navigation,
.pdf-zoom,
.pdf-actions {
    display: flex;
    align-items: center;
    gap: 5px;
}

.pdf-zoom {
    gap: 7px;
}

.toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
}

.toolbar-button:hover:not(:disabled) {
    border-color: #3f3f46;
    background: #27272a;
}

.toolbar-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.toolbar-button img {
    width: 16px;
    height: 16px;
}

.page-counter {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #a1a1aa;
    font-size: 11px;
}

.page-counter input {
    width: 35px;
    padding: 4px;
    border: 1px solid #3f3f46;
    border-radius: 5px;
    outline: none;
    background: #111113;
    color: #fafafa;
    font-size: 11px;
    text-align: center;
}

.page-counter input:focus {
    border-color: #6366f1;
}

.page-counter input::-webkit-inner-spin-button,
.page-counter input::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
}

.pdf-zoom span {
    min-width: 37px;
    color: #a1a1aa;
    font-size: 11px;
    text-align: center;
}

.pdf-scroll-container {
    display: flex;
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    padding: 16px;
    box-sizing: border-box;
    overflow: auto;
    scrollbar-color: #3f3f46 transparent;
}

.pdf-page {
    display: flex;
    justify-content: center;
    width: 100%;
    min-width: 0;
}

.pdf-page :deep(.vue-pdf-embed) {
    display: flex;
    justify-content: center;
    width: 100%;
}

.pdf-page :deep(canvas) {
    display: block;
    max-width: none;
    height: auto !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.pdf-empty,
.pdf-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    min-height: 250px;
    color: #71717a;
    font-size: 12px;
    text-align: center;
}

.pdf-empty img,
.pdf-error img {
    width: 34px;
    height: 34px;
    opacity: 0.65;
}

.pdf-status p,
.pdf-empty p {
    max-width: 250px;
    margin: 0;
    line-height: 1.6;
}

.pdf-error {
    color: #fca5a5;
}

.pdf-render-area {
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
    min-width: 0;
}

.pdf-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #111113;
    color: #a1a1aa;
    font-size: 12px;
    text-align: center;
    z-index: 5;
}

.pdf-overlay p {
    margin: 0;
}

.loading-spinner {
    width: 26px;
    height: 26px;
    border: 2px solid #3f3f46;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: pdf-spin 0.8s linear infinite;
}

@keyframes pdf-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
