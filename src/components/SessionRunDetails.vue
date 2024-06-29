<template>
    <div v-if="isLoading" class="absolute-full flex flex-center">
        <div class="column items-center justify-center">
            <q-spinner color="primary" size="60px" />
            <q-item-label class="text-h6 q-mt-md">Loading session Data...</q-item-label>
        </div>
    </div>
    <div v-else class="q-pa-md q-gutter-md">
        <q-card>
            <q-card-section>
                <div class="row items-center">
                    <q-avatar class="q-mr-md">
                        <img :src="require(`@/assets/session_type/${session.type}.png`)" />
                    </q-avatar>
                    <div class="q-mr-md">
                        <q-item-label lines="1" class="text-h6">{{ session.id }}</q-item-label>
                        <q-item-label lines="1">{{ session.character.serverName }}</q-item-label>
                        <q-item-label lines="1">{{ session.type }}</q-item-label>
                    </div>
                </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
                <div class="row q-gutter-md">
                    <div class="col-6">
                        <div>earnedKamas: {{ sessionRun.earnedKamas }}</div>
                        <div>earnedLevels: ({{ sessionRun.earnedLevels }}, {{ sessionRun.mapY }})</div>
                        <div>nbrFightsDone: {{ sessionRun.nbrFightsDone }}</div>
                        <div>nbrTreasuresHuntsDone: {{ sessionRun.nbrTreasuresHuntsDone }}</div>
                        <div>earnedJobLevels: {{ sessionRun.earnedJobLevels }}</div>
                    </div>
                    <div class="col-6">
                        <div>estimatedKamasWon: {{ sessionRun.estimatedKamasWon }}</div>
                        <div>nbrOfDeaths: {{ sessionRun.nbrOfDeaths }}</div>
                        <div>kamasSpentTeleporting: {{ sessionRun.kamasSpentTeleporting }}</div>
                        <div>numberOfTeleports: {{ sessionRun.numberOfTeleports }}</div>
                        <div>kamasSpentOpeningBank: {{ sessionRun.kamasSpentOpeningBank }}</div>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <q-tabs v-model="tab" class="q-mt-md">
            <q-tab name="actions" label="Actions" />
            <q-tab name="log" label="Log" />
        </q-tabs>

        <q-tab-panels v-model="curent_tab" animated>
            <q-tab-panel name="actions">
                <q-list bordered>
                </q-list>
            </q-tab-panel>
            <q-tab-panel name="log">
                <!-- Log display will be implemented later -->
            </q-tab-panel>
        </q-tab-panels>
    </div>
</template>
<!-- eslint-disable no-unused-vars -->
<script>

import { useSessionRunStore } from 'src/stores/sessionRuns';
import { useSessionStore } from 'stores/sessions';

export default {
    name: 'SessionRunDetails',
    props: {
        sessionRunId: {
            type: Number,
            required: true,
        }
    },
    setup(props) {
        const sessionRunStore = useSessionRunStore()
        const sessionStore = useSessionStore()

        return {
            sessionRunStore,
            sessionStore,
            current_tab: 'actions'
        }
    },
    async created() {
        await this.sessionRunStore.fetchSessionRun(this.sessionRunId)
    },
    methods: {
    }
}

</script>