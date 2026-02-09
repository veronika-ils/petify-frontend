<template>
    <article class="listing-card" @click="onCardClick" role="button" tabindex="0" @keydown.enter="onCardClick">
        <div class="media">
            <img
                class="image"
                :src="imageSrc"
                :alt="imageAlt"
                loading="lazy"
                @error="onImageError"
            />
            <button class="favorite" type="button" @click.stop="toggleFavorite" :aria-pressed="isFavorited">
                {{ isFavorited ? "♥" : "♡" }}
            </button>
            <div v-if="listing?.status" class="badge">{{ listing.status }}</div>
        </div>

        <div class="content">
            <div class="top">
                <h3 class="title" :title="titleText">{{ titleText }}</h3>
                <div v-if="priceText" class="price">{{ priceText }}</div>
            </div>

            <p v-if="createdText" class="created">Posted {{ createdText }}</p>

            <p class="meta">
                <span v-if="listing?.petType">{{ listing.petType }}</span>
                <span v-if="listing?.breed"> • {{ listing.breed }}</span>
                <span v-if="ageText"> • {{ ageText }}</span>
            </p>

            <p v-if="locationText" class="location">{{ locationText }}</p>

            <ul v-if="chips.length" class="chips" aria-label="Listing tags">
                <li v-for="chip in chips" :key="chip" class="chip">{{ chip }}</li>
            </ul>

            <p v-if="listing?.description" class="description">
                {{ listing.description }}
            </p>

            <div class="actions" @click.stop>
                <button class="primary" type="button" @click="emit('view', listing)">
                    View
                </button>
                <button class="secondary" type="button" @click="emit('contact', listing)">
                    Contact
                </button>
            </div>
        </div>
    </article>
</template>

<script setup>
import { computed, ref, watchEffect } from "vue";

const emit = defineEmits(["click", "view", "contact", "favorite"]);

const props = defineProps({
    listing: {
        type: Object,
        required: true,
    },
    favorited: {
        type: Boolean,
        default: false,
    },
    placeholderImage: {
        type: String,
        default:
            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%25' height='100%25' fill='%23f2f3f5'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%238a8f98'>Petify</text></svg>",
    },
});

const isFavorited = ref(false);
watchEffect(() => {
    isFavorited.value = !!props.favorited;
});

const imageBroken = ref(false);

const imageSrc = computed(() => {
    const img =
        props.listing?.imageUrl ||
        props.listing?.image ||
        props.listing?.photos?.[0] ||
        props.listing?.images?.[0];
    return !imageBroken.value && img ? img : props.placeholderImage;
});

const imageAlt = computed(() => {
    const name = props.listing?.name || props.listing?.title || "Pet listing";
    return `${name} photo`;
});

const titleText = computed(() => props.listing?.title || props.listing?.name || "Untitled listing");

const ageText = computed(() => {
    const a = props.listing?.age;
    const unit = props.listing?.ageUnit || "years";
    if (a === null || a === undefined || a === "") return "";
    return `${a} ${unit}`;
});

const locationText = computed(() => {
    const city = props.listing?.city;
    const state = props.listing?.state;
    const country = props.listing?.country;
    const parts = [city, state, country].filter(Boolean);
    return parts.length ? parts.join(", ") : "";
});

const priceText = computed(() => {
    const price = props.listing?.price ?? props.listing?.fee ?? props.listing?.adoptionFee;
    const currency = props.listing?.currency || "USD";
    if (price === null || price === undefined || price === "") return "";
    const num = Number(price);
    if (Number.isFinite(num)) {
        try {
            return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(num);
        } catch {
            return `$${num}`;
        }
    }
    return String(price);
});

const chips = computed(() => {
    const out = [];
    if (props.listing?.gender) out.push(props.listing.gender);
    if (props.listing?.size) out.push(props.listing.size);
    if (props.listing?.vaccinated) out.push("Vaccinated");
    if (props.listing?.neutered || props.listing?.spayed) out.push("Fixed");
    if (Array.isArray(props.listing?.tags)) out.push(...props.listing.tags.slice(0, 4));

    // When the backend returns minimal listing data, still show something useful.
    if (!out.length) {
        if (props.listing?.animalName) out.push(props.listing.animalName);
        if (props.listing?.ownerName) out.push(`By ${props.listing.ownerName}`);
        if (props.listing?.status) out.push(String(props.listing.status));
    }
    return out.filter(Boolean);
});

const createdText = computed(() => {
    const raw = props.listing?.createdAt || props.listing?.created_at;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    try {
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d);
    } catch {
        return d.toLocaleDateString();
    }
});

function onImageError() {
    imageBroken.value = true;
}

function onCardClick() {
    emit("click", props.listing);
}

function toggleFavorite() {
    isFavorited.value = !isFavorited.value;
    emit("favorite", { listing: props.listing, favorited: isFavorited.value });
}
</script>

<style scoped>
.listing-card {
    display: grid;
    grid-template-rows: auto 1fr;
    border: 1px solid rgba(17, 24, 39, 0.08);
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 10px 25px rgba(17, 24, 39, 0.06);
    cursor: pointer;
    transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
}

.listing-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 35px rgba(17, 24, 39, 0.10);
    border-color: rgba(249, 115, 22, 0.35);
}

.listing-card:focus {
    outline: 3px solid rgba(249, 115, 22, 0.35);
    outline-offset: 2px;
}

.media {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: #f6f7f9;
}

.image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.badge {
    position: absolute;
    left: 10px;
    top: 10px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(249, 115, 22, 0.92);
    color: #fff;
}

.favorite {
    position: absolute;
    right: 10px;
    top: 10px;
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    line-height: 1;
    display: grid;
    place-items: center;
}

.favorite[aria-pressed="true"] {
    color: var(--petify-orange, #f97316);
    border-color: rgba(249, 115, 22, 0.45);
}

.favorite:hover {
    background: #fff;
}

.content {
    padding: 12px 12px 14px;
    display: grid;
    gap: 8px;
}

.created {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
}

.top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    justify-content: space-between;
}

.title {
    font-size: 16px;
    margin: 0;
    font-weight: 650;
    color: #111827;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.price {
    white-space: nowrap;
    font-weight: 700;
    color: #111827;
}

.meta {
    margin: 0;
    font-size: 13px;
    color: #4b5563;
}

.location {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
}

.description {
    margin: 0;
    font-size: 13px;
    color: #4b5563;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.chips {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.chip {
    font-size: 12px;
    padding: 5px 8px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #eceef3;
}

.actions {
    display: flex;
    gap: 8px;
    margin-top: 2px;
}

.primary,
.secondary {
    flex: 1;
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    font-weight: 600;
}

.primary {
    background: var(--petify-orange, #f97316);
    color: #fff;
}

.primary:hover {
    background: var(--petify-orange-hover, #ea580c);
}

.secondary {
    background: #fff;
    color: #111827;
    border-color: #e5e7eb;
}

.secondary:hover {
    background: #f9fafb;
}
</style>
