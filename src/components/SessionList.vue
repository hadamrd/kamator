<template>
  <q-list bordered class="session-list" :Loading="isAccountsLoading || isCharactersLoading || isSessionsLoading || isSessionRunsLoading">
    <template v-if="isAccountsLoading || isCharactersLoading || isSessionsLoading || isSessionRunsLoading">
      <q-item>
        <q-item-section>
          <q-spinner-dots color="primary" />
          Loading...
        </q-item-section>
      </q-item>
    </template>
    <template v-else-if="isAccountsError || isCharactersError || isSessionsError || isSessionRunsError">
      <q-item>
        <q-item-section>
          <q-icon name="warning" color="negative" />
          Error loading data:
          <div v-if="isAccountsError">Accounts: {{ accountsError.message }}</div>
          <div v-if="isCharactersError">Characters: {{ charactersError.message }}</div>
          <div v-if="isSessionsError">Sessions: {{ sessionsError.message }}</div>
          <div v-if="isSessionRunsError">Session Runs: {{ sessionRunsError.message }}</div>
        </q-item-section>
      </q-item>
    </template>
    <template v-else>
      <q-item v-for="session in sessions" :key="session.id" clickable class="session-item"
        @click="selectSession(session)">
        <q-item-section avatar>
          <q-avatar size="50px">
            <img :src="getSessionImage(session)" alt="session-avatar" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="session-id">{{ session.id }}</q-item-label>
          <q-item-label caption>{{ session.type }}</q-item-label>
          <q-item-label caption>Status: <span
              :class="{ 'status-running': isSessionRunning(session.id), 'status-down': !isSessionRunning(session.id) }">{{
                getSessionStatus(session.id) }}</span></q-item-label>
        </q-item-section>
        <q-item-section class="col-5 gt-sm">
          <q-item-label>Character: <span class="highlight">{{ getSessionCharacter(session)?.name }}</span> ({{ getSessionCharacter(session)?.level }})</q-item-label>
          <q-item-label caption>Account: {{ getSessionCharacter(session)?.account }}</q-item-label>
          <q-item-label caption>Server: {{ getSessionCharacter(session)?.serverName }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn-group push>
            <q-btn v-if="!isSessionRunning(session.id)" icon="play_arrow" color="positive"
              @click.stop="toggleStartStop(session.id)" aria-label="Start Session" />
            <q-btn v-else icon="stop" color="negative" @click.stop="toggleStartStop(session.id)"
              aria-label="Stop Session" />
            <q-btn icon="delete" color="negative" @click.stop="deleteSession(session.id)" />
            <q-btn icon="visibility" color="primary" :to="getLogViewerRoute(session)" @click.stop="logButtonClick" />
          </q-btn-group>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script>
import { ref } from 'vue';
import accountsApiInstance from 'src/api/account';
import charactersApiInstance from 'src/api/characters';
import sessionRunsApiInstance from 'src/api/sessionRuns';
import sessionsApiInstance from 'src/api/session';
import { SessionStatusEnum } from 'src/enums/sessionEnums';
import { Loading } from 'quasar';

export default {
  name: 'SessionList',
  setup() {
    const {
      isLoading: isAccountsLoading,
      data: accounts,
      isError: isAccountsError,
      error: accountsError,
      refetch: refetchAccounts,
    } = accountsApiInstance.useGetItems();

    const {
      isLoading: isCharactersLoading,
      data: characters,
      isError: isCharactersError,
      error: charactersError,
      refetch: refetchCharacters,
    } = charactersApiInstance.useGetItems();

    const {
      isLoading: isSessionsLoading,
      data: sessions,
      isError: isSessionsError,
      error: sessionsError,
      refetch: refetchSessions,
    } = sessionsApiInstance.useGetItems();

    const {
      isLoading: isSessionRunsLoading,
      data: sessionRuns,
      isError: isSessionRunsError,
      error: sessionRunsError,
      refetch: refetchSessionRuns,
    } = sessionRunsApiInstance.useGetItems();

    const isSessionRunning_ = ref({});
    
    return {
      accounts,
      characters,
      sessions,
      sessionRuns,
      isAccountsLoading,
      isCharactersLoading,
      isSessionsLoading,
      isSessionRunsLoading,
      isAccountsError,
      isCharactersError,
      isSessionsError,
      isSessionRunsError,
      accountsError,
      charactersError,
      sessionsError,
      sessionRunsError,
      isSessionRunning_,
    };
  },
  methods: {
    getLogViewerRoute(session) {
      const character = this.getSessionCharacter(session);
      const accountId = character?.account;
      return { name: 'LogViewer', params: { botName: accountId } };
    },
    logButtonClick() {
      console.log('Button clicked');
    },
    getSessionCharacter(session) {
      if (!this.characters) return null;
      return this.characters.find(
        (character) => character.id == session.character
      );
    },
    async toggleStartStop(sessionId) {
      try {
        if (this.isSessionRunning(sessionId)) {
          let session_run = this.getSessionCurrentRun(sessionId);
          await sessionRunsApiInstance.stopSession(session_run.id);
        } else {
          await sessionRunsApiInstance.addItem({ session: sessionId });
        }
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: error.message,
          icon: 'warning',
          position: 'top',
          timeout: 1000,
        });
      }
    },
    getSessionStatus(sessionId) {
      if (this.isSessionRunning(sessionId)) {
        return 'RUNNING';
      }
      return 'DOWN';
    },
    isSessionRunning(sessionId) {
      if (this.sessionRuns == null) return false;
      let session_run = this.getSessionCurrentRun(sessionId);
      let is_running =
        session_run != null &&
        session_run.status !== SessionStatusEnum.TERMINATED &&
        session_run.status !== SessionStatusEnum.CRASHED &&
        session_run.status !== SessionStatusEnum.STOPPED;
      return is_running;
    },
    getSessionRunsHistory(sessionId) {
      if (this.sessionsRuns == null) return null;
      return this.sessionsRuns.find(
        (session_run) => session_run.session === sessionId
      );
    },
    getSessionCurrentRun(sessionId) {
      if (this.sessionRuns == null) return null;
      let session_run = this.sessionRuns.find(
        (session_run) =>
          session_run.session === sessionId &&
          session_run.exitStatus == null &&
          session_run.status != SessionStatusEnum.TERMINATED &&
          session_run.status != SessionStatusEnum.CRASHED
      );
      return session_run;
    },
    async deleteSession(sessionId) {
      try {
        await sessionsApiInstance.deleteItem(sessionId);
        this.$q.notify({
          color: 'positive',
          message: 'Session deleted successfully',
          icon: 'check',
          position: 'top',
          timeout: 1000,
        });
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: error.message,
          icon: 'warning',
          position: 'top',
          timeout: 1000,
        });
      }
    },
    getSessionImage(session) {
      return new URL(
        `/src/assets/session_type/${session.type}.png`,
        import.meta.url
      ).href;
    },
    selectSession(session) {
      this.$emit('selectSession', session);
    },
  },
};
</script>

<style scoped>
.session-list {
  margin: 10px auto;
  padding: 10px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.q-item {
  transition: transform 0.3s, background-color 0.3s;
}

.q-item:hover {
  background-color: #f0f0f0;
  transform: scale(1.01);
}

.q-avatar img {
  border-radius: 50%;
}

.q-btn-group {
  display: flex;
  gap: 3px;
}

.status-running {
  color: #4caf50;
  /* Green color for running status */
}

.status-down {
  color: #f44336;
  /* Red color for down status */
}

.highlight {
  font-weight: bold;
  color: #1976d2;
}
</style>
