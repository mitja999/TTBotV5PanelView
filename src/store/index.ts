import Vue from "vue";
import Vuex from "vuex";
const objects = require('../engine/classes.js');
const translations = require('../engine/translations.js');
const { ls } = require('vue-storage-plus');

Vue.use(Vuex);
export default new Vuex.Store({
  state: {
    CheckLogic: require("../engine/checkLogic.js").default,
    log: {} as any,
    socket: {} as any,
    localStorage: ls,
    Player: new objects.default.Player(),
    Village: new objects.default.village(),
    selectedVillage: new objects.default.village(),
    troopCost: new objects.default.troopCost(),
    BuildingRez: new objects.default.BuildingRez(),
    Buildings: new objects.default.Buildings(),
    uc: new objects.default.uc(),
    uc2: new objects.default.uc2(),
    custom: objects.default.custom,
    options: objects.default.options,
    start: false,
    landType: objects.default.landType,
    lang: new translations.default.Translate(),
    taskCheckTime: new Date(),
    taskWorkingTime: new Date(),
    redirectTime: new Date(),
    taskStatus: "Stop",
    executing: false,
    windowdimension: "2560-1440",
    counter: 0,
    workingDuration: 99999999,
    gameUrl: '' as string,
    version: {
      web: "3.4.52",
      extension: "3.4.26"
    },
    iframesrc: "https://traviantactics.com",
    images: {
      r1:
        "https://gpack.travian.com/85427b63/mainPage/img_ltr/general/resources/lumber_small.png",
      r2:
        "https://gpack.travian.com/85427b63/mainPage/img_ltr/general/resources/clay_small.png",
      r3:
        "https://gpack.travian.com/85427b63/mainPage/img_ltr/general/resources/iron_small.png",
      r4:
        "https://gpack.travian.com/85427b63/mainPage/img_ltr/general/resources/crop_small.png"
    },
    mapZoom: 3,
    map: {
      width: 801,
      height: 801,
      left: -400,
      right: 400,
      bottom: -400,
      top: 400
    },
    redirectPagesV4: ["/karte.php", "/statistiken.php", "/messages.php", "/berichte.php", "/dorf1.php", "/dorf2.php", "/hero.php", "/hero.php?t=4"],
    redirectPagesV5: ["/#/page:village", "/#/page:resources/", "/#/page:map/", "/#/page:village/herotab:Auctions/window:hero/cp:1", "/#/page:village/herotab:CardGame/window:hero/cp:1", "/#/page:village/herotab:Inventory/window:hero"],
    timerCounter: 6
  },

  mutations: {
    checkDivs(state) {
      for (var propertyName in state.options.style) {
        if (state.options.style[propertyName].left !== undefined) {
          if (
            state.options.style[propertyName].left +
            state.options.style[propertyName].width >
            window.innerWidth
          ) {
            state.options.style[propertyName].left =
              window.innerWidth - state.options.style[propertyName].width;
            state.options.style[propertyName].width = 300;
          }
          if (
            state.options.style[propertyName].top +
            state.options.style[propertyName].height >
            window.innerHeight
          ) {
            state.options.style[propertyName].top =
              window.innerHeight - state.options.style[propertyName].height;
            state.options.style[propertyName].width = 300;
          }

          if (state.options.style[propertyName].top < 30) {
            state.options.style[propertyName].top = 30;
            state.options.style[propertyName].width = 300;
          }
          if (state.options.style[propertyName].left < 30) {
            state.options.style[propertyName].left = 30;
            state.options.style[propertyName].width = 300;
          }
          if (state.options.style[propertyName].z < 10) {
            state.options.style[propertyName].z = 10;
            state.options.style[propertyName].width = 300;
          }
        }
      }
    },
    SOCKET_CONNECT(state) {
      state.log.debug("conected");
    },

    SOCKET_DISCONNECT(state) {
      state.log.debug("disconected");
    },
    SOCKET_TIME(state, message) { // <-- this action is triggered when `user_message` is emmited on the server

    },
  },
  getters: {
    getPlayer: state => () => state.Player,
    getPlayerOptionstaskchecktime: state => () => state.Player.options.taskchecktime,
    getPlayerOptionsworkingdurationtime: state => () => state.Player.options.workingdurationtime,
    getSelectedVillageId: state => () => state.selectedVillage.villageId,
    troopIcon: state => (id: number) => {
      let tribeIcon = state.Player.tribeId * 1 - 1;
      id = id % 10;
      let TroopUrl =
        "https://gpack.travian.com/85427b63/mainPage/img/u/section/u" +
        (tribeIcon === 0 ? "" : tribeIcon) +
        "" +
        id +
        "-ltr.png";
      return {
        background: "url(" + TroopUrl + ")",
        width: "120px",
        height: "120px",
        zoom: 0.45
      };
    },
    troopIconSmall: state => (id: number) => {
      let tribeIcon = state.Player.tribeId * 1 - 1;
      id = id % 10;
      let TroopUrl =
        "https://gpack.travian.com/85427b63/mainPage/img/u/section/u" +
        (tribeIcon === 0 ? "" : tribeIcon) +
        "" +
        id +
        "-ltr.png";
      return {
        background: "url(" + TroopUrl + ")",
        width: "120px",
        height: "120px",
        zoom: 0.35
      };
    },
    troopIconFF: state => (id: number) => {
      let tribeIcon = state.Player.tribeId * 1 - 1;
      id = id % 10;

      let TroopUrl =
        "https://gpack.travian.com/f315f521/mainPage/img/u/section/u" +
        (tribeIcon === 0 ? "" : tribeIcon) +
        "" +
        id +
        "-ltr.png";
      return {
        background: "url(" + TroopUrl + ")",
        width: "120px",
        height: "120px",
        zoom: 0.35
      };
    },
    getIcon: state => (id: number) => {
      let tribeIcon = "";
      let TroopUrl =
        "https://gpack.travian.com/f315f521/mainPage/img_ltr/general/resources/" +
        id +
        ".png";
      return {
        background: "url(" + TroopUrl + ")",
        width: "120px",
        height: "120px",
        zoom: 0.4
      };
    },
    getOptions: state => () => state.options,
    getHighestZ: state => () => {
      let z = 1;
      for (var propertyName in state.options.style) {
        if (state.options.style[propertyName].z > z) {
          z = state.options.style[propertyName].z;
        }
      }
      return z + 1;
    },
    getNewBuiding: state => () => {
      return new objects.default.building();
    }
  },
  actions: {
    send_email({ state }, message) {
      let data = {
        to: state.Player.options.email.email,
        subject: message.subject,
        message: message.message
      };

      state.socket.client.emit('sendmail', data);
    }
  }
});
