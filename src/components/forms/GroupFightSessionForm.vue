<template>
    <q-dialog persistent>
        <div class="q-pa-md q-ma-md min-width-800px">
            <q-card>
                <q-card-section class="bg-primary text-center text-white">
                    <div class="text-h6">Group fight</div>
                </q-card-section>
                <q-card-section class="q-pa-md q-ma-md">
                    <q-input dense v-model="id" label="Session ID" class="q-mb-md" :rules="[validateID]" required />
                    <q-input type="number" step="0.1" v-model.number="monsterLvlCoefDiff" label="Monster Coeff Diff" class="q-mb-md" required>
                    </q-input>
                    <q-input type="number" step="1" v-model.number="fightsPerMinute" label="Fights per minute" class="q-mb-md" required>
                    </q-input>
                    <q-select class="q-mb-md" dense outlined bottom-slots v-model="character" use-input
                        :options="characterSelectOptions" @filter="filterFn" @input="clearFilter" label="character" 
                        option-label="name">
                        <template v-slot:hint>Character that will lead the bots party.</template>
                        <template v-slot:append>
                            <q-icon name="close" class="cursor-pointer" icon="clear"
                                @click.stop.prevent="character = null" :disable="!character"></q-icon>
                        </template>
                    </q-select>
                    <q-select dense class="q-mb-md" outlined bottom-slots ref="select"
                        v-model="followers" use-input multiple emit-value input-debounce="0" label="select mules"
                        option-label="name" :options="followersSelectOptions" @filter="filterFn" @input="clearFilter">
                        <template v-slot:hint>Characters that will follow the leader.</template>
                        <template v-slot:selected-item="{ opt }">
                            <q-chip dense class="q-mr-xs" removable @remove="removeOption(opt)">{{ opt.name }}</q-chip>
                        </template>
                        <template v-slot:append>
                            <q-icon name="close" class="cursor-pointer" icon="clear" @click.stop.prevent="followers = []"
                                :disable="followers.length < 1"></q-icon>
                        </template>
                    </q-select>
                    <q-select class="q-mb-md" dense outlined bottom-slots v-model="selectedUnloadType"
                        :options="sessionStore.sessionUnloadTypeChoices" label="Select unload Type" option-label="label"
                        option-value="value">
                        <template v-slot:hint>How would you like the bot to unload when full.</template>
                    </q-select>
                    <q-select class="q-mb-md" dense outlined bottom-slots v-model="path" :options="pathStore.paths"
                        label="Select farm path" option-label="id">
                        <template v-slot:hint>The path that the bot will follow.</template>
                    </q-select>
                    <q-separator />
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
import { usePathStore } from 'stores/paths'
import {
    SessionTypeEnum, UnloadTypeEnum
} from 'src/enums/sessionEnums';
import { v4 as uuidv4 } from 'uuid';

export default {
    name: 'GroupFightSessionForm',
    setup() {
        const sessionStore = useSessionStore();
        const accountsStore = useAccountStore();
        const pathStore = usePathStore();
        return {
            sessionStore,
            pathStore,
            session: ref(null),
            characters: ref([]),
            followers: ref([]),
            filterValue: ref(''),
            id: ref(null),
            seller: ref(null),
            character: ref(null),
            accountsStore,
            UnloadTypeEnum,
            unloadType: ref(UnloadTypeEnum.BANK),
            SessionTypeEnum,
            monsterLvlCoefDiff: ref(4),
            fightsPerMinute: ref(1),
            path: ref(null)
        }
    },
    async created() {
        this.characters = await this.accountsStore.getCharacters();
        this.paths = await this.pathStore.getPaths();
        let asession = await this.sessionStore.getSession(this.currSessionId);
        console.log(asession)
        if (!asession) {
            this.id = uuidv4();
            this.monsterLvlCoefDiff = 4;
            this.character = this.characters[0];
            this.path = this.paths[0];
            this.unloadType = UnloadTypeEnum.BANK;
            this.seller = null;
            this.followers = [];
            this.fightsPerMinute = 1;
        } else {
            this.id = asession.id;
            this.unloadType = asession.unloadType;
            this.monsterLvlCoefDiff = asession.monsterLvlCoefDiff;
            this.path = asession.path;
            this.character = asession.character;
            this.followers = asession.followers;
            this.fightsPerMinute = asession.fightsPerMinute;
        }
    },
    computed: {
        characterSelectOptions() {
            if (!this.characters || !this.seller) {
                return this.characters || [];
            }

            return this.characters.filter(character => {
                const notSameAccount = character.account !== this.seller.account;
                const notTheSellerItself = character.id !== this.seller.id;
                const sameServer = this.seller.serverName === character.serverName;

                return sameServer && notSameAccount && notTheSellerItself;
            });
        },
        followersSelectOptions() {
            if (!this.characters || !this.character) {
                return [];
            }

            return this.characters.filter(follower => {
                const notSameCharacterAccount = follower.account !== this.character.account;
                const notSameSellerAccount = !this.seller || follower.account !== this.seller.account;
                const sameCharacterServer = follower.serverName === this.character.serverName;

                return sameCharacterServer && notSameCharacterAccount && notSameSellerAccount;
            });
        },
        sellerSelectOptions() {
            if (!this.characters || !this.character) {
                return this.characters || [];
            }

            return this.characters.filter(seller => {
                const notSameAccountAsCharacter = seller.accountId !== this.character.account;
                const notTheCharacterItself = seller.id !== this.character.id;
                const sameServer = seller.serverName === this.character.serverName;
                const notAFollowerAccount = !this.followers.some(follower => follower.account === seller.account);

                return sameServer && notSameAccountAsCharacter && notTheCharacterItself && notAFollowerAccount;
            });
        },
        selectedUnloadType: {
            get() {
                return this.unloadType;
            },
            set(option) {
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
            // Assume errors are in the format { field_name: ["Error message"], ... }
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
        removeOption(option) {
            this.followers = this.followers.filter(o => o.id !== option.id);
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
                monsterLvlCoefDiff: this.monsterLvlCoefDiff,
                path: this.path.id,
                unloadType: this.unloadType,
                seller: this.seller?.id,
                followers: this.followers.map(follower => follower.id),
                fightsPerMinute: this.fightsPerMinute,
                type: SessionTypeEnum.GROUP_FIGHT
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
            let sellerAccountId = this.seller?.account;
            let followerAccountIds = this.followers.map(follower => follower.account);
            if (!characterAccountId) {
                return "Character is required";
            }
            if (this.unloadType === UnloadTypeEnum.SELLER) {
                if (!sellerAccountId)
                    return "Seller is required when unloading to seller";
                if (sellerAccountId === characterAccountId)
                    return "Seller must belong to a different account than the character";
                if (this.seller.serverName !== this.character.serverName)
                    return "Seller must be on the same server as the character";
                if (followerAccountIds.includes(sellerAccountId))
                    return "Seller must belong to a different account than followers";
            }
            // character must belong to a different account than its followers
            if (followerAccountIds.includes(characterAccountId)) {
                return "Followers must belong to a different account than the character";
            }
            // followers must be on the same server as the character
            if (this.followers.some(follower => follower.serverName !== this.character.serverName)) {
                return "Followers must be on the same server as the character";
            }
            return true;
        },
        closeModal() {
            this.id = null;
            this.unloadType = UnloadTypeEnum.BANK;
            this.seller = null;
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
        },
        seller(newSeller, oldSeller) {
            if (!newSeller) {
                this.seller = null;
                return;
            }
            if (this.character && newSeller.account === oldSeller?.account && newSeller.serverName === oldSeller?.serverName) {
                this.character = null;
            }
        },
        unloadType(newVal, oldVal) {
            if (newVal === UnloadTypeEnum.BANK) {
                this.seller = null;
            }
        }
    }
}
</script>

<style scoped>
.min-width-800px {
max-width: none !important;
min-width: 800px;
}
</style>