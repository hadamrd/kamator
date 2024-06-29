<template>
    <q-dialog persistent>
        <div class="q-pa-md q-ma-md">
            <q-card>
                <q-card-section class="bg-primary text-center text-white">
                    <div class="text-h6">Solo fight</div>
                </q-card-section>
                <q-card-section class="q-pa-md q-ma-md">
                    <q-input dense v-model="id" label="Session ID" class="q-mb-md" :rules="[validateID]" required />
                    <q-select class="q-mb-md" dense outlined bottom-slots v-model="character" use-input
                        :options="characterSelectOptions" @filter="filterFn" @input="clearFilter" label="character"
                        option-label="name">
                        <template v-slot:hint>Character that will lead the bots party.</template>
                        <template v-slot:append>
                            <q-icon name="close" class="cursor-pointer" icon="clear"
                                @click.stop.prevent="character = null" :disable="!character"></q-icon>
                        </template>
                    </q-select>
                    <q-select dense outlined bottom-slots v-model="leader" :options="leaderSelectOptions"
                        @filter="filterFn" @input="clearFilter" use-input @change="clearInput" label="leader"
                        option-label="name">
                        <template v-slot:append>
                            <q-icon name="close" class="cursor-pointer" icon="clear" @click.stop.prevent="seller = null"
                                :disable="!leader"></q-icon>
                        </template>
                        <template v-slot:hint>Character that will collect the resources.</template>
                    </q-select>
                    <q-select class="q-mb-md" dense outlined bottom-slots v-model="selectedUnloadType"
                        :options="sessionStore.sessionUnloadTypeChoices" label="Select unload Type" option-label="label">
                        <template v-slot:hint>How would you like the bot to unload when full.</template>
                    </q-select>
                    <q-select dense outlined bottom-slots v-model="seller" :options="sellerSelectOptions"
                        @filter="filterFn" @input="clearFilter" use-input @change="clearInput" label="Seller"
                        option-label="name" v-show="unloadType === UnloadTypeEnum.SELLER">
                        <template v-slot:append>
                            <q-icon name="close" class="cursor-pointer" icon="clear" @click.stop.prevent="seller = null"
                                :disable="!seller"></q-icon>
                        </template>
                        <template v-slot:hint>Character that will collect the resources.</template>
                    </q-select>
                </q-card-section>
                <q-card-actions align="center">
                    <q-btn flat dense color="primary" class="q-mr-md" label="Confirm" @click="confirm"><q-icon
                            name="check" /></q-btn>
                    <q-btn flat dense color="negative" class="q-ml-md" label="Cancel" @click="closeModal"><q-icon
                            name="close" /></q-btn>
                </q-card-actions>
            </q-card>
        </div>
    </q-dialog>
</template>
<!-- eslint-disable no-unused-vars -->
<script>
import { ref } from 'vue'
import { useAccountStore } from 'stores/accounts'
import { useSessionStore } from 'stores/sessions'
import {
    SessionTypeEnum, UnloadTypeEnum
} from 'src/enums/sessionEnums';
import { v4 as uuidv4 } from 'uuid';

export default {
    name: 'MuleFightSessionForm',
    setup() {
        const sessionStore = useSessionStore();
        const accountsStore = useAccountStore();
        return {
            sessionStore,
            session: ref(null),
            characters: ref([]),
            filterValue: ref(''),
            id: ref(null),
            seller: ref(null),
            character: ref(null),
            leader: ref(null),
            accountsStore,
            SessionTypeEnum,
            UnloadTypeEnum,
            unloadType: ref(UnloadTypeEnum.BANK)
        }
    },
    async created() {
        this.characters = await this.accountsStore.getCharacters();
        let asession = await this.sessionStore.getSession(this.currSessionId);
        console.log(asession)
        if (!asession) {
            this.id = uuidv4();
            this.character = this.characters[0];
            this.leader = null;
            this.seller = null;
            this.unloadType = UnloadTypeEnum.BANK;
        } else {
            this.id = asession.id;
            this.character = asession.character;
            this.leader = asession.leader;
            this.seller = asession.seller;
            this.unloadType = asession.unloadType;
        }
    },
    computed: {
        characterSelectOptions() {
            if (!this.characters)
                return [];

            return this.characters.filter(ch => {
                return (ch.account !== this.leader?.account && ch.account !== this.leader?.account)
            });
        },
        sellerSelectOptions() {
            if (!this.characters)
                return [];

            if (!this.character)
                return []

            return this.characters.filter(ch => {
                return (ch.serverName == this.character.serverName && ch.account !== this.character.account && ch.account !== this.leader?.account)
            });
        },
        leaderSelectOptions() {
            if (!this.characters)
                return [];

            if (!this.character)
                return []

            return this.characters.filter(ch => {
                return (ch.serverName == this.character.serverName && ch.account !== this.character.account && ch.account !== this.seller?.account)
            });
        },
        selectedUnloadType: {
            get() {
                return this.unloadType;
            },
            set(option) {
                console.log(option)
                this.unloadType = option.value;
            }
        }
    },
    props: {
        currSessionId: {
            type: String,
            default: null
        }
    },
    methods: {
        handleErrors(errors) {
            for (const [key, value] of Object.entries(errors)) {
            if (Array.isArray(value)) {
                this.$q.notify({
                color: 'negative',
                message: `${key}: ${value.join(' ')}`, // Joining messages if array
                icon: 'error',
                position: 'top',
                });
            }
            }
        },
        filterFn(val, update) {
            update(() => {
                this.filterValue = val;
            })
            return
        },
        clearFilter() {
            this.filterValue = '';
        },
        clearInput() {
            this.$refs.select.clear();
        },
        async confirm() {
            let res = this.validateAccounts();
            if (res !== true) {
                this.$q.notify({
                    color: 'negative',
                    message: res,
                    icon: 'warning',
                    position: 'top',
                    timeout: 1000
                });
                return;
            }
            res = this.validateID(this.id);
            if (res !== true) {
                this.$q.notify({
                    color: 'negative',
                    message: res,
                    icon: 'warning',
                    position: 'top',
                    timeout: 1000
                });
                return;
            }
            let session = {
                id: this.id,
                character: this.character.id,
                leader: this.leader.id,
                unloadType: this.unloadType,
                seller: this.seller?.id,
                type: SessionTypeEnum.MULE_FIGHT
            }
            try {
                await this.sessionStore.createSession(session);
                this.closeModal();
            } catch (error) {
                this.handleErrors(error.response.data);
            }
        },
        validateID(name) {
            if (!name) {
                return "Name is required."
            } else if (name.length < 3) {
                return "Name must be at least 3 characters long."
            } else if (name.length > 50) {
                return "Name must be less than 50 characters long."
            } else if (!/^[a-zA-Z0-9_-]*$/.test(name)) {
                return "Name can only contain alphanumeric characters, dashes and underscores."
            }
            return true;
        },
        validateAccounts() {
            let characterAccountId = this.character?.account;
            let leaderAccountId = this.leader?.account;
            if (!characterAccountId) {
                return "Character is required";
            }
            if (!leaderAccountId) {
                return "Leader is required";
            }
            if (this.unloadType === UnloadTypeEnum.SELLER && !this.seller?.account) {
                return "Seller is required when unload type is seller";
            }
            return true;
        },
        closeModal() {
            this.id = null;
            this.character = null;
            this.leader = null;
            this.$emit('finished');
        }
    },
    watch: {
        character: function (newval, oldval) {
            if (!newval) {
                this.character = null;
                return;
            }
            if (this.seller && (newval.serverName !== this.seller.serverName || newval.account === this.seller.account))
                this.seller = null;
            if (this.leader && (newval.serverName !== this.leader.serverName || newval.account === this.leader.account))
                this.leader = null;
        },
        leader(newLeader, oldLeader) {
            if (!newLeader) {
                this.seller = null;
                return;
            }
            if (this.character && newLeader.account === oldLeader?.account && newLeader.serverName === oldLeader?.serverName) {
                this.character = null;
            }
        },
        unloadType(newVal, oldVal) {
            if (newVal !== UnloadTypeEnum.SELLER)
                this.seller = null;
        }
    }
}
</script>

<style scoped>
.q-select label {
    font-size: 12px;
}
</style>