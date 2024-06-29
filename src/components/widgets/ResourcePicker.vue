<template>
    <q-card-actions class="q-pa-md" align="center">
        <q-btn flat dense color="primary" :label="confirmButtonLabel" @click="confirmSelections">
            <q-icon name="check" />
        </q-btn>
        <q-btn flat dense color="negative" :label="cancelButtonLabel" @click="closeModal">
            <q-icon name="close" />
        </q-btn>
    </q-card-actions>
    <q-select class="q-pa-md" dense ref="select" v-model="selectedResources" use-input multiple emit-value
        input-debounce="0" label="search" option-label="name" @filter="updateSearch" :options="filteredResources"
        @input="search = ''">
        <template v-slot:option="scope">
            <q-item @click="toggleSelect(scope.opt)" clickable>
                <q-avatar size="20px" style="margin-right: 10px;">
                    <img :src="getResourceImage(scope.opt)" :alt="scope.opt.name" />
                </q-avatar>
                {{ scope.opt.name }}
            </q-item>
        </template>
        <template v-slot:selected-item></template>
    </q-select>
    <q-card-section>
        <div class="selected-resources-container">
            <div class="chip-container q-pa-md" :style="{ '--chips-per-row': chipsPerRow }">
                <q-chip v-for="selected in selectedResources" :key="selected.id" removable
                    @remove="toggleSelect(selected)">
                    <img :src="getResourceImage(selected)" class="chip-image" />
                    <!-- <span class="chip-text">{{ selected.name }}</span> Using class for styling -->
                </q-chip>
            </div>
        </div>
        <div ref="resourceContainer">
            <q-expansion-item v-for="(group, skillId) in groupedResources" :key="skillId" expand-separator>
                <template v-slot:header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <!-- Add an avatar or icon next to the skill label -->
                            <q-avatar size="36px" class="q-mr-md">
                                <img :src="getJobImage(skillId)">
                            </q-avatar>
                            <span class="text-ellipsis" style="max-width: calc(100% - 50px);">{{ getJobName(skillId) }}</span>
                        </div>
                    </div>
                </template>
                <div class="grid-container">
                    <div v-for="res in group" :key="res.id"
                        :class="{ 'selected': isSelected(res), 'resource-select-box': true }"
                        @click="toggleSelect(res)">
                        <img :src="getResourceImage(res)" :alt="res.name" class="resource-image" />
                        <q-tooltip class="resource-name">{{ res.name }}</q-tooltip>
                    </div>
                </div>
            </q-expansion-item>
        </div>
    </q-card-section>
</template>

<script>
import { ref, watch, toRefs } from 'vue';
import { Notify } from 'quasar';
import { useDofusMapStore } from 'stores/dofusMapStore';

export default {
    name: 'resourceSelect',
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        maxSelections: {
            type: Number,
            default: 20
        },
        initialSelectedResources: {
            type: Array,
            default: () => []
        },
        cancelButtonLabel: {
            type: String,
            default: 'cancel'
        },
        confirmButtonLabel: {
            type: String,
            default: 'confirm'
        },
        closeOnApply: {
            type: Boolean,
            default: true
        },
        chipsPerRow: {
            type: Number,
            default: 5
        }
    },
    emits: ['select', 'finished', 'update:modelValue'],
    setup(props) {
        const search = ref('');
        const { initialSelectedResources } = toRefs(props);
        const selectedResources = ref([]);

        watch(initialSelectedResources, (newValue, oldValue) => {
            if (newValue !== oldValue) {
                selectedResources.value = [...newValue];
            }
        }, { immediate: true }); // Run the watcher immediately on component mount

        return {
            search,
            selectedResources,
            resources: ref([]),
            jobsNames: ref([]),
            store: useDofusMapStore()
        }
    },
    async mounted() {
        this.resources = await this.store.getResourcesData();
        // Initialize jobsNames as an empty object
        this.jobsNames = {};
        // Populate the jobsNames dictionary
        this.resources.forEach(resource => {
            const { skillId, skillName } = resource;
            // Ensure each id maps to a unique name (assuming skillName does not change per skillId)
            if (!this.jobsNames[skillId]) {
                this.jobsNames[skillId] = skillName;
            }
        });
    },
    computed: {
        groupedResources() {
            const groups = {};
            this.resources.forEach(resource => {
                if (!groups[resource.skillId]) {
                    groups[resource.skillId] = [];
                }
                groups[resource.skillId].push(resource);
            });
            return groups;
        },
        filteredResources() {
            if (!this.search)
                return [];
            return this.resources.filter(r => r.name.toLowerCase().includes(this.search.toLowerCase()));
        }
    },
    methods: {
        updateSearch(val, done) {
            this.search = val;
            done();
        },
        removeOption(opt) {
            this.selectedResources = this.selectedResources.filter(o => o !== opt);
        },
        closeModal() {
            this.$emit("update:modelValue", false);
            this.$emit('finished');
        },
        confirmSelections() {
            this.$emit('select', this.selectedResources);
            if (this.closeOnApply) {
                this.closeModal();
            }
        },
        isSelected(resource) {
            return this.selectedResources.includes(resource);
        },
        toggleSelect(resource) {
            const index = this.selectedResources.findIndex(r => r.id === resource.id);
            if (index !== -1) {
                // Resource is currently selected, remove it
                this.selectedResources.splice(index, 1);
                this.$emit('select', this.selectedResources);
            } else if (this.selectedResources.length < this.maxSelections) {
                // Not selected and can add more
                this.selectedResources.push(resource);
                this.$emit('select', this.selectedResources);
            } else {
                // Handle max selection limit
                Notify.create({
                    type: 'negative',
                    message: `You can only select up to ${this.maxSelections} resources`,
                    timeout: 600
                });
                this.shakeContainer();
            }
        },
        shakeContainer() {
            const containerDiv = this.$refs.resourceContainer;
            containerDiv.classList.add('shake');
            setTimeout(() => containerDiv.classList.remove('shake'), 700);
        },
        getResourceImage(resource) {
            return require(`@/assets/dofusMap/resourceSprite/${resource.id}.png`);
        },
        getJobImage(skillId) {
            try {
                return require(`@/assets/jobs/${skillId}.jpg`);
            } catch (err) {
                return
            }
        },
        getJobName(skillId) {
            return this.jobsNames[skillId];
        },
        selectFromSearch(resource) {
            if (!this.isSelected(resource))
                this.toggleSelect(resource);
            this.search = ''; // Clear search input after selection
        }
    }
}
</script>

<style scoped>
.selected {
    background-color: #555;
    /* Darker background for selected items */
}

@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    10%,
    30%,
    50%,
    70%,
    90% {
        transform: translateX(-5px);
    }

    20%,
    40%,
    60%,
    80% {
        transform: translateX(5px);
    }
}

.shake {
    animation: shake 0.82s cubic-bezier(.36, .07, .19, .97) both;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 100px;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
    grid-gap: 5px;
    padding: 5px;
}

.resource-select-box {
    box-sizing: border-box;
    margin: 5px;
    padding: 2px;
    border: 1px solid #ccc;
    /* Optional, shows a border around each resource */
    border-radius: 4px;
    /* Optional, adds rounded corners */
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s;
    flex-direction: column;
}

.resource-select-box:hover {
    transform: scale(1.06);
    /* Slight enlargement on hover */
    background-color: #444;
    /* Darker background on hover for better contrast in dark themes */
}

.selected-resources-container .q-chip {
    margin: 2px;
}

.chip-image {
    width: 24px;
    height: 24px;
    border-radius: 12px;
    margin-right: 8px;
}

.resource-image {
    width: 35px;
    height: auto;
}

.chip-image {
    width: 22px;
    height: 22px;
    margin-right: 2px;
}

.chip-text {
    font-size: 9px;
    /* Consistent naming convention for classes */
}

:root {
    --chips-per-row: 7;
    /* Default to 4 chips per row */
}

.chip-container {
    flex-wrap: wrap;
    gap: 4px;
    margin: 2px;
    ;
    padding: 4px;
    width: 300px;
    border: 1px solid rgb(136, 133, 133);
}

.q-chip {
    flex: 0 1 calc((100% / var(--chips-per-row)) - 4px);
    /* Calculate width based on the number of chips per row */
}
</style>