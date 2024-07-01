<template>
  <q-dialog persistent>
    <div class="q-pa-md q-ma-md min-width-800px">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">Farm</div>
        </q-card-section>
        <q-card-section class="q-pa-md q-ma-md">
          <q-input
            dense
            v-model="id"
            label="Session Name"
            class="q-mb-md"
            :rules="[validateName]"
            required
          />
          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="character"
            use-input
            :options="characterSelectOptions"
            @filter="filterFn"
            @input="clearFilter"
            label="main character"
            option-label="name"
          >
          </q-select>
          <q-input
            type="number"
            step="1"
            dense
            v-model.number="numberOfCovers"
            label="Number of covers per path"
            class="q-mb-md"
            required
          >
          </q-input>
          <q-select
            dense
            class="q-mb-md"
            outlined
            bottom-slots
            ref="select"
            v-model="pathsList"
            use-input
            multiple
            emit-value
            input-debounce="0"
            label="select paths"
            option-label="id"
            :options="pathStore.paths"
            @filter="filterFn"
            @input="clearFilter"
          >
            <template v-slot:selected-item="{ opt }">
              <q-chip
                dense
                class="q-mr-xs"
                removable
                @remove="removeOption(opt)"
                >{{ opt.id }}</q-chip
              >
            </template>
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                icon="clear"
                @click.stop.prevent="pathsList = []"
                :disable="pathsList.length < 1"
              ></q-icon>
            </template>
          </q-select>
          <JobResourceSelector @updateJobFilter="handleJobFiltersData" />
          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="selectedUnloadType"
            :options="sessionStore.sessionUnloadTypeChoices"
            label="Select unload Type"
            option-label="label"
            option-value="value"
          >
          </q-select>
          <q-select
            dense
            outlined
            bottom-slots
            v-model="seller"
            :options="characterSelectOptions"
            @filter="filterFn"
            @input="clearFilter"
            use-input
            @change="clearInput"
            label="Seller"
            option-label="name"
            v-show="unloadType === UnloadTypeEnum.SELLER"
          >
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                icon="clear"
                @click.stop.prevent="seller = null"
                :disable="!seller"
              ></q-icon>
            </template>
            <template v-slot:hint
              >Character that will collect bots resources.</template
            >
          </q-select>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            flat
            dense
            color="primary"
            class="q-mr-md"
            label="Confirm"
            @click="confirm"
            ><q-icon name="check"
          /></q-btn>
          <q-btn
            flat
            dense
            color="negative"
            class="q-ml-md"
            label="Cancel"
            @click="closeModal"
            ><q-icon name="close"
          /></q-btn>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>
<!-- eslint-disable no-unused-vars -->
<script>
import { ref } from "vue";
import { useAccountStore } from "stores/accounts";
import { useSessionStore } from "stores/sessions";
import { usePathStore } from "stores/paths";
import JobResourceSelector from "components/widgets/JobResourceSelector.vue";
import { SessionTypeEnum, UnloadTypeEnum } from "src/enums/sessionEnums";
import { v4 as uuidv4 } from "uuid";

export default {
  name: "FarmSessionForm",
  components: {
    JobResourceSelector,
  },
  setup() {
    const sessionStore = useSessionStore();
    const accountStore = useAccountStore();
    const pathStore = usePathStore();

    return {
      session: ref(null),
      filterValue: ref(""),
      id: ref(null),
      seller: ref(null),
      paths: ref([]),
      character: ref(null),
      path: ref(null),
      pathsList: ref([]),
      accountStore,
      type: ref(SessionTypeEnum.FIGHT),
      numberOfCovers: ref(3),
      SessionTypeEnum,
      sessionStore,
      pathStore,
      unloadType: ref(UnloadTypeEnum.BANK),
      UnloadTypeEnum,
      characters: ref([]),
    };
  },
  async created() {
    this.characters = await this.accountStore.getCharacters();
    this.paths = await this.pathStore.getPaths();
    let asession = await this.sessionStore.getSession(this.currSessionId);
    console.log(asession);
    if (!asession) {
      this.id = uuidv4();
      this.unloadType = UnloadTypeEnum.BANK;
      this.character = this.characters[0];
      this.seller = null;
      this.path = null;
      this.pathsList = [];
      this.numberOfCovers = 3;
    } else {
      this.leader = asession.leader;
      this.server = asession.server;
      this.followers = asession.followers;
      this.unloadType = asession.unloadType;
      this.seller = asession.seller;
      this.path = asession.path;
      this.id = asession.id;
      this.numberOfCovers = asession.monsterLvlCoefDiff;
    }
  },
  computed: {
    characterSelectOptions() {
      if (!this.characters) return [];

      return this.characters.filter((ch) => {
        return (ch.account !== ch.account) !== this.leader?.account;
      });
    },
    sellerSelectOptions() {
      if (!this.characters) return [];

      if (!this.character) return [];

      return this.characters.filter((ch) => {
        return (
          ch.serverName == this.character.serverName &&
          ch.account !== this.character.account
        );
      });
    },
    selectedUnloadType: {
      get() {
        return this.unloadType;
      },
      set(option) {
        console.log(option);
        this.unloadType = option.value;
      },
    },
  },
  props: {
    currSessionId: {
      type: String,
      default: null,
    },
  },
  methods: {
    handleJobFiltersData(jobFilters) {
      console.log("selectedJobsDetails", jobFilters);
      this.jobFilters = jobFilters;
    },
    handleErrors(errors) {
      for (const [key, value] of Object.entries(errors)) {
        if (Array.isArray(value)) {
          this.$q.notify({
            color: "negative",
            message: `${key}: ${value.join(" ")}`,
            icon: "error",
            position: "top",
          });
        }
      }
    },
    filterFn(val, update) {
      update(() => {
        this.filterValue = val;
      });
      return;
    },
    clearFilter() {
      this.filterValue = "";
    },
    clearInput() {
      this.$refs.select.clear();
    },
    removePathOption(option) {
      this.pathsList = this.pathsList.filter((o) => o.id !== option.id);
    },
    async confirm() {
      let res = this.validateAccounts();
      if (res !== true) {
        this.$q.notify({
          color: "negative",
          message: res,
          icon: "warning",
          position: "top",
          timeout: 1000,
        });
        return;
      }
      res = this.validateID(this.id);
      if (res !== true) {
        this.$q.notify({
          color: "negative",
          message: res,
          icon: "warning",
          position: "top",
          timeout: 1000,
        });
        return;
      }
      let session = {
        id: this.id,
        character: this.character.id,
        numberOfCovers: this.numberOfCovers,
        unloadType: this.unloadType,
        seller: this.seller?.id,
        jobFilters: this.jobFilters,
      };
      if (this.pathsList.length > 1) {
        session.pathsList = this.pathsList.map((p) => p.id);
        session.type = SessionTypeEnum.MULTIPLE_PATHS_FARM;
      } else {
        session.path = this.pathsList[0].id;
        session.type = SessionTypeEnum.FARM;
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
        return "Name is required.";
      } else if (name.length < 3) {
        return "Name must be at least 3 characters long.";
      } else if (name.length > 50) {
        return "Name must be less than 30 characters long.";
      } else if (!/^[a-zA-Z0-9_-]*$/.test(name)) {
        return "Name can only contain alphanumeric characters, dashes and underscores.";
      }
      return true;
    },
    validateAccounts() {
      let characterAccountId = this.character?.account;
      let sellerAccountId = this.seller?.account;
      if (!characterAccountId) {
        return "Character is required";
      }
      if (this.unloadType === UnloadTypeEnum.SELLER) {
        if (!sellerAccountId)
          return "Seller is required when unloading to aseller";
        if (sellerAccountId === characterAccountId)
          return "Seller must belong to a different account than the character";
        if (this.seller.serverName !== this.character.serverName)
          return "Seller must be on the same server as the character";
      }
      return true;
    },
    closeModal() {
      this.id = null;
      this.character = null;
      this.seller = null;
      this.pathsList = [];
      this.jobFilters = [];
      this.$emit("finished");
    },
  },
  watch: {
    character: function (newval, oldval) {
      if (!newval) {
        this.character = null;
        return;
      }
      if (
        this.seller &&
        (newval.serverName !== this.seller.serverName ||
          newval.account === this.seller.account)
      )
        this.seller = null;
    },
    seller(newSeller, oldSeller) {
      if (!newSeller) {
        this.seller = null;
        return;
      }
      if (
        this.character &&
        newSeller.account === oldSeller?.account &&
        newSeller.serverName === oldSeller?.serverName
      ) {
        this.character = null;
      }
    },
    unloadType(newVal, oldVal) {
      if (newVal === UnloadTypeEnum.BANK) {
        this.seller = null;
      }
    },
  },
  beforeRouteLeave(to, from, next) {
    if (this.$q.notify.isActive) {
      this.$q.notify.clear();
    }
    next();
  },
};
</script>

<style scoped>
.min-width-800px {
  max-width: none !important;
  min-width: 800px;
}
</style>
