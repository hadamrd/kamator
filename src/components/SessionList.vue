<template>
    <q-list bordered>
        <q-item v-for="session in sessionStore.sessions" :key="session.id">
            <q-item-section avatar>
                <q-avatar size="50px">
                    <img :src="getSessionImage(session)" alt="session-avatar">
                </q-avatar>
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ session.id }}</q-item-label>
                <q-item-label caption>{{ session.type }}</q-item-label>
                <q-item-label caption>Status: {{ getSessionStatus(session.id) }}</q-item-label>
            </q-item-section>
            <q-item-section class="col-5 gt-sm">
                <q-item-label>Main character: {{ getSessionCharacter(session)?.name }}</q-item-label>
                <q-item-label caption>Server: {{ getSessionCharacter(session)?.serverName }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-btn-group push>
                    <q-btn v-if="!isSessionRunning(session.id)" icon="play_arrow"
                        @click="toggleStartStop(session.id)" aria-label="Start Session" />
                    <q-btn v-else icon="stop" @click="toggleStartStop(session.id)"
                        aria-label="Stop Session" />
                    <q-btn icon="delete" @click="deleteSession(session.id)" />
                    <q-btn icon="visibility" @click="viewSessionDetails(session.id)" />
                </q-btn-group>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script>
import { useSessionStore } from 'stores/sessions';
import { useAccountStore } from 'stores/accounts';
import { useSessionRunStore } from 'src/stores/sessionRuns';
import { ref } from 'vue';
import { SessionStatusEnum } from 'src/enums/sessionEnums';

export default {
    name: 'SessionList',
    setup() {
        const sessionStore = useSessionStore();
        const accountStore = useAccountStore();
        const sessionRunStore = useSessionRunStore();
        const isSessionRunning_ = ref({});
        return { sessionStore, accountStore, sessionRunStore, isSessionRunning_ };
    },
    async created() {
        await this.sessionStore.getSessions();
        await this.accountStore.getAccounts();
        await this.accountStore.getCharacters();
        await this.sessionRunStore.getSessionsRuns();
    },
    methods: {
        getSessionCharacter(session) {
            if (!this.accountStore.characters) 
                return null;
            return this.accountStore.characters.find(character => character.id == session.character);
        },
        toggleStartStop(sessionId) {
            if (this.isSessionRunning(sessionId)) {
                this.sessionRunStore.stopSession(sessionId);
            } else {
                this.sessionRunStore.startSession(sessionId);
            }
        },
        getSessionStatus(sessionId) {
            return this.sessionRunStore.getSessionStatus(sessionId) || SessionStatusEnum.DOWN;  // Make sure getSessionStatus method exists in sessionRunStore
        },
        isSessionRunning(sessionId) {
            return this.sessionRunStore.isSessionRunning(sessionId);
        },
        async deleteSession(sessionId) {
            try {
                await this.sessionStore.deleteSession(sessionId);
            } catch (error) {
                this.$q.notify({
                    color: 'negative',
                    message: error.message,
                    icon: 'warning',
                    position: 'top',
                    timeout: 1000
                });
            }
        },
        getSessionImage(session) {
          return new URL(`/src/assets/session_type/${session.type}.png`, import.meta.url).href
        }
    }
};
</script>

<style scoped></style>