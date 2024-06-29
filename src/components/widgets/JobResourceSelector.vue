<template>
    <q-select dense class="q-mb-s" outlined bottom-slots ref="select" v-model="selectedJobs" use-input multiple
        emit-value option-value="id" input-debounce="0" label="select jobs" option-label="name" :options="jobsOptions"
        @filter="filterJobs">
        <template v-slot:selected-item="{ opt }">
            <q-chip dense class="q-mr-xs" removable @remove="removeJobOption(opt)">{{ getJobNameById(opt) }}</q-chip>
        </template>
        <template v-slot:append>
            <q-icon name="close" class="cursor-pointer" icon="clear" @click.stop.prevent="selectedJobs = []"
                :disable="selectedJobs.length < 1"></q-icon>
        </template>
    </q-select>
    <div>
        <div class="resource-grid-label">Select Resources</div> <!-- Label for the grid -->
        <div class="grid-container">
            <div v-for="jobFilter in jobFilters" :key="jobFilter.jobId" class="grid-item">
                <div class="text-subtitle2 q-mt-md">{{ skills[jobFilter.jobId]?.name }} Resources</div>
                <!-- q-select as before -->
                <q-select dense class="q-mb-md" outlined bottom-slots ref="select" v-model="jobFilter.resourcesIds"
                    :options="resourceOptions(jobFilter.jobId)" option-value="id" use-input multiple emit-value
                    input-debounce="0" option-label="name"
                    @filter="(val, update) => filterResources(jobFilter.jobId, val, update)"
                    @input="() => clearResourceFilter(jobFilter.jobId)">
                    <!-- Templates for options and selected items as before -->
                    <template v-slot:option="scope">
                        <q-item v-bind="scope.itemProps">
                            <q-item-section>
                                {{ scope.opt.name }} (level {{ scope.opt.levelMin }})
                            </q-item-section>
                        </q-item>
                    </template>
                    <template v-slot:selected-item="{ opt }">
                        <q-chip dense class="q-mr-xs" removable @remove="removeResourceOption(jobFilter.jobId, opt)">{{
                            getResourceNameById(jobFilter.jobId, opt) }}</q-chip>
                    </template>
                    <template v-slot:append>
                        <q-icon name="close" class="cursor-pointer" icon="clear"
                            @click.stop.prevent="jobFilter.resourcesIds = []"
                            :disable="jobFilter.resourcesIds.length < 1"></q-icon>
                    </template>
                </q-select>
            </div>
        </div>
    </div>
</template>
<!-- eslint-disable no-unused-vars -->

<script>
import { ref } from 'vue'
import { useGameDataStore } from 'stores/gameData'


export default {
    name: 'JobResourceSelector',
    emits: ['updateJobFilter'],
    setup() {
        const gameDataStore = useGameDataStore();
        return {
            jobFilters: ref([]),
            selectedJobs: ref([]),
            skills: ref([]),
            jobOptionFilterValue: ref(''),
            resourceOptionFilterValue: ref({}),
            gameDataStore,
            skillsOptions: ref([])
        };
    },
    async created() {
        await this.gameDataStore.getGameData();
        this.skills = this.gameDataStore.getSkills();
        this.skillsOptions = Object.values(this.skills);
    },
    computed: {
        jobsOptions() {
            return this.skillsOptions.filter(
                skill => {
                    if (this.selectedJobs.includes(skill.id))
                        return false;

                    if (this.jobOptionFilterValue && !skill.name.toLowerCase().includes(this.jobOptionFilterValue.toLowerCase()))
                        return false;

                    return true;
                }
            );
        }
    },
    methods: {
        clearInput() {
            this.$refs.select.clear();
        },
        getResourceNameById(jobId, resourceId) {
            const resource = this.gameDataStore.getJobGatherableResources(jobId).find(r => r.id === resourceId);
            return resource ? resource.name : 'Unknown Resource';
        },
        getJobNameById(jobId) {
            return this.skills[jobId]?.name || 'Unknown Job';
        },
        resourceOptions(jobId) {
            let options = this.gameDataStore.getJobGatherableResources(jobId);
            let filterValue = this.resourceOptionFilterValue[jobId];
            if (!filterValue)
                return options;
            filterValue = filterValue.toLowerCase();
            let jobFilter = this.jobFilters.find(jobFilter => jobFilter.jobId === jobId);
            options = options.filter(
                (resource) => {
                    if (jobFilter.resourcesIds.includes(resource.id))
                        return false;
                    if (filterValue && !resource.name.toLowerCase().includes(filterValue))
                        return false;
                    return true;
                }
            );
            return options;
        },
        filterJobs(val, update) {
            update(() => {
                this.jobOptionFilterValue = val;
            })
            return
        },
        filterResources(jobId, val, update) {
            update(() => {
                this.resourceOptionFilterValue[jobId] = val;
            })
            return
        },
        clearResourceFilter(jobId) {
            this.resourceOptionFilterValue[jobId] = '';
        },
        updateJobFilters() {
            this.jobOptionFilterValue = '';
            // Filter out job filters for jobs that are no longer selected
            // Here we use job.id since selectedJobs contains job objects
            this.jobFilters = this.jobFilters.filter(jobFilter => this.selectedJobs.includes(jobFilter.jobId));

            // Find all selected job IDs that do not have a filter yet
            const jobIdsWithFilters = this.jobFilters.map(jobFilter => jobFilter.jobId);
            const newJobIds = this.selectedJobs.filter(jobId =>
                !jobIdsWithFilters.includes(jobId));

            // Add new job filters for these jobs
            for (const jobId of newJobIds) {
                this.jobFilters.push({
                    jobId: jobId,
                    resourcesIds: []
                });
            }
        },
        removeJobOption(option) {
            this.selectedJobs = this.selectedJobs.filter(jobId => jobId !== option.id);
        },
        removeResourceOption(jobId, option) {
            const jobFilter = this.jobFilters.find(jobFilter => jobFilter.jobId === jobId);
            jobFilter.resourcesIds = jobFilter.resourcesIds.filter(resource => resource.id !== option.id);
        }
    },
    watch: {
        selectedJobs: {
            handler(selectedJobs, oldVal) {
                this.updateJobFilters();
            },
            deep: true
        },
        jobFilters: {
            handler(jobFilters, oldVal) {
                this.$emit('updateJobFilter', this.jobFilters);
            },
            deep: true
        }
    }
}
</script>

<style scoped>
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    /* Adjust column sizing for better responsiveness */
    grid-gap: 5px;
    /* Space between columns and rows */
    border: 1px solid #ccc;
    /* Light grey border around the grid container */
    padding: 12px;
    /* Padding inside the grid container for aesthetics */
    margin-bottom: 20px;
    /* Top margin for the container */
    border-radius: 5px;
    /* Optional: Adds rounded corners to the border */
}
</style>
../stores/gameData