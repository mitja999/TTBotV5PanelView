﻿
const applyActionV5 = require("./applyActionV5.js");
const applyActionV4 = require("./applyActionV4.js");

const exports = function () {
	let taskTimers = {
		analyze: {
			time: 0
		},
		build: {
			time: 0
		},
		trade: {
			time: 0
		},
		hero: {
			time: 0
		},
		train: {
			time: 0
		},
		farm: {
			time: 0
		}
	}


	this.lock = false;
	this.isredirected = false;

	this.init = function (store) {
		this.store = store;
		this.log = store.state.log;
		this.ApplyActions = undefined;
	}
	const getWindowHTMLdata = {
		"classes": [
			{
				"class": "r1",
				"values": ["backgroundImage"]
			},
			{
				"class": "r2",
				"values": ["backgroundImage"]
			},
			{
				"class": "r3",
				"values": ["backgroundImage"]
			},
			{
				"class": "r4",
				"values": ["backgroundImage"]
			}
		]
	}
	function setImages(classes, vue1) {
		for (let i = 0; i < getWindowHTMLdata.classes.length; i++) {

			if (getWindowHTMLdata.classes[i]["class"] == "r1" || getWindowHTMLdata.classes[i]["class"] == "r2" || getWindowHTMLdata.classes[i]["class"] == "r3" || getWindowHTMLdata.classes[i]["class"] == "r4") {
				if (classes[getWindowHTMLdata.classes[i]["class"]]) {
					vue1.store.state.images[getWindowHTMLdata.classes[i]["class"]] = classes[getWindowHTMLdata.classes[i]["class"]]["backgroundImage"].split('"')[1]
				}
			}
		}
	}
	this.loadPlayer = async function () {
		this.log.debug("loadPlayer", this.ApplyActions, this.store.state.Player.loggedIn, applyActionV4, applyActionV5);
		if (this.ApplyActions === undefined || !this.store.state.Player.loggedIn) {
			let rez = await this.store.getters.request("", getWindowHTMLdata, "getWindowHTML");
			this.log.debug("getWindowHTML", rez);
			if (rez) {
				if (rez.orign) {

					this.store.state.Player.url = rez.orign;
					this.store.state.gameUrl = rez.url;
				}

				if (rez.document) {
					let wrapObject = false;
					if (rez.orign.indexOf('kingdoms.com') !== -1) {

						if (this.ApplyActions === undefined) {
							wrapObject = true;
							this.ApplyActions = applyActionV5.default;
							await this.ApplyActions.initAA(this.log, this.store);
							this.store.state.Player.version = 5;
						}
						await this.ApplyActions.getPlayer(rez);
						this.store.state.Player.loggedIn = true;

					} else {
						if (rez.document.indexOf('Travian.Game.version') !== -1) {


							if (this.ApplyActions === undefined) {
								wrapObject = true;
								this.ApplyActions = applyActionV4.default;
								await this.ApplyActions.initAA(this.log, this.store);
								this.store.state.Player.version = 4;
							}
							if (rez.classes) {
								setImages(rez.classes, this)
							}
							try {
								await this.ApplyActions.getPlayer(rez);
							} catch{
								return false;
							}
							this.store.state.Player.loggedIn = true;
							this.store.state.Player.villages = this.store.state.Player.villages.filter(function (value, index, arr) {
								return value.villageId !== 0;

							});
						}
					}
					if (wrapObject) {
						wrapObjectFunctions(
							this.ApplyActions,
							async function (fname, o, arg) {
								if (fname !== 'getPlayer' && fname !== 'analyzePlayer') {

									while (this.store.state.executing) {
										this.log.debug("request already in progress, waiting " + fname, arg);
										await sleep(1000);
									}
									this.store.state.executing = true;
								}

								this.log.debug("LOG: before calling " + fname, arg);

								if (tasksToCheckActivity.includes(fname)) {
									if (arg[1] !== undefined && !arg[1].enabled) {
										return false;
									}
									arg[1].executionTimes = arg[1].executionTimes === undefined ? [] : arg[1].executionTimes;
									arg[1].executionTimes.push(Date.now());
									if (arg[1].executionTimes.length >= 100) {
										let millis = arg[1].executionTimes[4] - arg[1].executionTimes[0];
										arg[1].executionTimes.shift();
										if (millis <= 240000) {
											arg[1].enabled = false;
											arg[1].executionTimes = [];
											this.store.state.Player.options.logs.push({
												"time": new Date().getTime(),
												"name": fname,
												"success": false,
												"text": "task disabled because of 10 tries in 4 minutes",
												"villageId": arg[0].villageId
											});
											return false;
										}
									}
								}

								this.store.state.taskStatus = fname;
								if (!this.store.state.Player.start && !(fname === "analyzeBuildings" || fname === "cropFind" || fname === "search" || fname === "initAA" || fname === "onRouted" || fname === "analyzePlayer" || fname === "getPlayer" || fname === "getGoldClubFarmlists" || fname === "coppyFarmlist")) {
									return false;
								}
								return true;
							}.bind(this),
							async function (fname, o, arg, r) {

								this.log.debug("LOG: after calling " + fname, arg);
								if (fname !== 'getPlayer' && fname !== 'analyzePlayer') {
									this.store.state.executing = false;
								}
								this.store.state.taskStatus = this.store.state.timerCounter;

								let text = "";
								let logname = fname;
								let success = r;
								if (this.store.state.Player.version == 4) {
									if (r)
										success = r.success;
								}
								if (success && arg !== undefined && arg[1] !== undefined && arg[1].executionTimes !== undefined && arg[1].executionTimes.length > 0) {
									arg[1].executionTimes.shift();
								}

								switch (fname) {
									case "logout":
										text = "Analyze player"
										break;
									case "getPlayer":
										text = "Analyze player"
										break;
									case "build":

										text = "Building: " + this.store.state.Buildings[arg[2].buildingType][0][1] + ", LocationId: " + arg[2].locationId + ", level: " + arg[2].lvlNext;

										if (this.store.state.Player.version == 4) {
											if (r && r.error) {
												logname = "Error"
												text = "Building failed (" + text + "): " + r.errorMessage;
											}
										}

										break;
									case "trade":
										text = "(" + arg[1].x + "|" + arg[1].y + "), [ Wood=" + arg[2]["1"] + " Clay=" + arg[2]["2"] + " Iron=" + arg[2]["3"] + " Grain=" + arg[2]["4"] + " ]";
										if (this.store.state.Player.version == 4) {
											if (r && r.error) {
												logname = "Error"
												text = "Trade failed (" + text + "): " + r.errorMessage;
											}
										}
										break;
									case "train":
										text = "Type: " + arg[1].type + ", Amount: " + arg[1].amount;
										if (this.store.state.Player.version == 4) {
											if (r && r.error) {
												logname = "Error"
												text = "Train failed (" + text + "): " + r.errorMessage;
											}
										}
										break;
									case "adventure":
										text = "Hero adventure"
										break;
									case "farm":
										text = "(" + arg[1].x + "|" + arg[1].y + "), " + arg[1].name + " [" + arg[2].amount["1"] + "," + arg[2].amount["2"] + "," + arg[2].amount["3"] + "," + arg[2].amount["4"] + "," + arg[2].amount["5"] + "," + arg[2].amount["6"] + " ]";
										if (r && r.fail) {
											text = "Farming failed: " + text + " (" + r.failmessage + ")"
										}
										break;
									case "finishNow":
										text = "finishNow";
										break;
									case "analyzeDorf1":
										text = "Dorf 1 analysed";
										break;
									case "analyzeDorf2":
										text = "Dorf 2 analysed";
										break;
									case "analyzeMarketplace":
										text = "Marketplace analysed";
										break;
									case "onRouted":
										return;
									case "analyzePlayer":
										return;
									case "search":
										return;
									case "getGoldClubFarmlists":
										return;
									case "coppyFarmlist":
										return;
									case "analyzeBuildings":
										return;
									case "farmGoldClub":
										text = "goldclub attacks sent.";
										if (this.store.state.Player.version == 4) {
											if (r && r.error) {
												logname = "Error"
												text = "farmGoldClub failed: " + r.errorMessage;
											} else if (r.message) {
												text = r.message
											}
										}
										break;
									case "getGoldClubFarmlists":
										return;
								}
								let villageId = "";
								try {
									villageId = arg[0].name;
								} catch{ }


								this.store.state.Player.options.logs.push({
									"time": new Date().getTime(),
									"name": logname,
									"success": success,
									"text": text,
									"villageId": villageId
								});
								if (this.store.state.Player.options.logs.length > 500) {

									this.store.state.Player.options.logs.splice(400, this.store.state.Player.options.logs.length - 400)
								}
								if (r && r.error) {
									let throwerror = this.checkLastLogs()
									this.log.debug("throwerror", throwerror)
									if (throwerror) {
										//this.store.state.Player.start = false;
										//clearInterval(v.timer);
										throw r.errorMessage
									}

								}

							}.bind(this)
						);
					}
				}
			}
		}
	}



	this.onRouted = async function (selectedVillage, route, type) {
		return await this.ApplyActions.onRouted(selectedVillage, route, type);
	}

	this.checkLastLogs = function () {
		let logslength = this.store.state.Player.options.logs.length
		let numberOfFails = 0
		for (let i = 0; i < 50 & i < this.store.state.Player.options.logs.length; i++) {
			let log = this.store.state.Player.options.logs[i]
			if (log.time > new Date().getTime() - 300000 & log.name == "Error") {
				numberOfFails += 1
			} else {
				break
			}
		}
		//console.log("numberOfFails", numberOfFails)
		if (numberOfFails > 10) {
			this.store.state.Player.options.logs.unshift({
				"time": new Date().getTime(),
				"name": "Error",
				"success": true,
				"text": "More than 10 errors happend in last 5 minutes. Bot stopped.",
				"villageId": "/"
			});
			return true
		}
		return false
	}.bind(this)

	this.checkTasks = async function () {
		if (this.lock) {
			this.log.debug('checkTasks locked');
			return;
		}
		this.lock = true;
		this.log.debug('checkTasks start');
		if (this.isredirected) {
			this.isredirected = false;
			await this.ApplyActions.loginCustom();
			await sleep(3000);
			this.store.state.iframesrc = this.store.state.gameUrl;
		}

		await this.ApplyActions.analyzePlayer();
		for (let i = 0; i < this.store.state.Player.villages.length; i++) {
			let village = this.store.state.Player.villages[i];
			try {
				await this.ApplyActions.analyzeVillage(village);
			} catch (e) {
				taskTimers.analyze.time = new Date().getTime() + 10 * 60 * 1000;
				reportError(e, "analyzePlayer");
				return;
			}
			try {
				if (new Date().getTime() > taskTimers.build.time)
					await checkBuild(village);
			} catch (e) {
				taskTimers.build.time = new Date().getTime() + 10 * 60 * 1000;
				reportError(e, "checkBuild");
			}
			try {
				if (new Date().getTime() > taskTimers.trade.time)
					await checkTrade(village);
			} catch (e) {
				taskTimers.trade.time = new Date().getTime() + 10 * 60 * 1000;
				reportError(e, "checkTrade");
			}
			try {
				if (new Date().getTime() > taskTimers.train.time)
					await checkTrain(village);
			} catch (e) {
				taskTimers.train.time = new Date().getTime() + 10 * 60 * 1000;
				reportError(e, "checkTrain");
			}
			try {
				if (new Date().getTime() > taskTimers.farm.time)
					await checkFarm(village);
			} catch (e) {
				taskTimers.farm.time = new Date().getTime() + 10 * 60 * 1000;
				reportError(e, "checkFarm");

			}
		}

		try {
			if (new Date().getTime() > taskTimers.hero.time)
				await checkHero();
		} catch (e) {
			taskTimers.hero.time = new Date().getTime() + 10 * 60 * 1000;
			reportError(e, "checkHero");
		}
		this.log.debug('checkTasks done');
		this.lock = false;
		this.setTasks();
	}

	this.logout = async function () {
		await this.ApplyActions.logout();
	}
	this.redirect = async function () {
		this.isredirected = true;
		this.store.state.iframesrc = "http://traviantactics.com";
	}

	this.search = async function (parameters) {
		this.store.state.custom.farmfinder.progress = 0.0;
		this.store.state.custom.farmfinder.showProgress = true;
		this.store.state.custom.farmfinder.running = true;
		let start = this.store.state.Player.start;
		this.store.state.Player.start = false;
		await this.ApplyActions.search(parameters);
		this.store.state.Player.start = start;
		this.store.state.custom.farmfinder.progress = 100;
		this.store.state.custom.farmfinder.showProgress = false;
		this.store.state.custom.farmfinder.running = false;
	}

	this.cropFind = async function (parameters) {
		this.store.state.custom.farmfinder.progress = 0.0;
		this.store.state.custom.farmfinder.showProgress = true;
		this.store.state.custom.farmfinder.running = true;
		let start = this.store.state.Player.start;
		this.store.state.Player.start = false;
		await this.ApplyActions.cropFind(parameters);
		this.store.state.Player.start = start;
		this.store.state.custom.farmfinder.progress = 100;
		this.store.state.custom.farmfinder.showProgress = false;
		this.store.state.custom.farmfinder.running = false;
	}

	this.getGoldClubFarmlists = async function (parameters) {
		this.store.state.custom.farmfinder.progress = 0.0;
		this.store.state.custom.farmfinder.showProgress = true;
		this.store.state.custom.farmfinder.running = true;
		let start = this.store.state.Player.start;
		this.store.state.Player.start = false;
		await this.ApplyActions.getGoldClubFarmlists(parameters);
		this.store.state.Player.start = start;
		this.store.state.custom.farmfinder.progress = 100;
		this.store.state.custom.farmfinder.showProgress = false;
		this.store.state.custom.farmfinder.running = false;
	}

	this.coppyFarmlist = async function (village, farmlist, name, copyStatus) {

		let start = this.store.state.Player.start;
		this.store.state.Player.start = false;
		await this.ApplyActions.coppyFarmlist(village, farmlist, name, copyStatus);
		this.store.state.Player.start = start;
	}

	this.getConfig = async function () {
		this.log.debug("getConfig", this.store.state.Player);
		let configLs = this.store.state.localStorage.get("settings");
		if (configLs !== false) {
			copyProperties(this.store.state.options, configLs);
		}
		this.store.state.options.init = true;

		return true;
	}


	this.setConfig = async function () {
		//this.log.debug("set tasks", this.store.state.options);
		this.store.state.localStorage.set("settings", this.store.state.options);
		return true;
	}

	this.analyzeBuildings = async function (villageId) {
		if (this.ApplyActions !== undefined) {
			this.ApplyActions.analyzeBuildings(villageId);
		}
		return true;
	}

	this.getTasks = async function () {

		this.log.debug('Get localStorage getTasks data: ', this.store.state.Player.playerId);

		if (this.store.state.Player.playerId === 0) {
			this.log.debug("no playerId", this.store.state.Player.playerId);
			return true;
		}

		let loggedIn = this.store.state.Player.loggedIn;

		this.log.debug("getConfig", this.store.state.Player);
		let villageTasks = this.store.state.localStorage.get(this.store.state.Player.playerId + "");
		if (villageTasks !== false && villageTasks !== null) {
			for (let i = 0; i < villageTasks.length; i++) {
				try {
					villageTasks[i].tasks.build.forEach(t => {
						t.enabled = t.enabled === undefined ? true : t.enabled;
					});
					villageTasks[i].tasks.trade.forEach(t => {
						t.enabled = t.enabled === undefined ? true : t.enabled;
					});
					villageTasks[i].tasks.train.forEach(t => {
						t.enabled = t.enabled === undefined ? true : t.enabled;
					});
					villageTasks[i].tasks.farms.forEach(t => {
						t.enabled = t.enabled === undefined ? true : t.enabled;
						t.villages.forEach(f => {
							f.enabled = f.enabled === undefined ? true : f.enabled;
						});
						if (t.selectedFarmlist !== undefined && t.selectedFarmlist.farms !== undefined) {
							t.selectedFarmlist.farms.forEach(f => {
								f.enabled = f.enabled === undefined ? true : f.enabled;
							});
						}
					});
				} catch (ex) {
					this.log.debug(ex);
				}
				for (let j = 0; j < this.store.state.Player.villages.length; j++) {
					if (this.store.state.Player.villages[j].villageId === villageTasks[i].villageId) {
						copyProperties(this.store.state.Player.villages[j].tasks, villageTasks[i].tasks);
					}
				}
			}
		}

		let playerOptions = this.store.state.localStorage.get(this.store.state.Player.playerId + "options");
		if (playerOptions !== false) {
			copyProperties(this.store.state.Player.options, playerOptions);

		}
		this.store.state.Player.loggedIn = loggedIn;
		this.store.state.Player.tasksLoad = true;

		this.store.state.windowdimension = "L" + window.innerWidth + "-" + window.innerHeight;

		let parsedUrl = new URL(this.store.state.Player.url);

		/*let userInfo = await this.store.getters.request("", "", "getCredentials", "", 0, parsedUrl.hostname);
		if (userInfo.length === 1) {
			if (userInfo[0].users.length === 1) {
				this.store.state.Player.options.User.username = userInfo[0].users[0].password;
				this.store.state.Player.options.User.password = userInfo[0].users[0].name;
			} else if (userInfo[0].users.length !== 0) {
				let user = userInfo[0].users.find(d => d.password === this.store.state.Player.name);
				if (user !== undefined) {
					this.store.state.Player.options.User.username = user.password;
					this.store.state.Player.options.User.password = user.name;
				}
			}
		}*/
		return true;
	}


	this.setTasks = async function () {
		if (this.store.state.Player.playerId === 0) {
			return true;
		}
		if (this.lock) {
			return;
		}
		this.log.debug("saving tasks.");

		if (this.store.state.Player.tasksLoad === false) return true;

		let villageTasks = [];

		for (let i = 0; i < this.store.state.Player.villages.length; i++) {
			if (this.store.state.Player.villages[i] !== undefined) {
				villageTasks.push({
					villageId: this.store.state.Player.villages[i].villageId,
					tasks: this.store.state.Player.villages[i].tasks
				});
			}
		}
		//this.log.debug("set tasks", villageTasks);
		this.store.state.localStorage.set(this.store.state.Player.playerId + "", villageTasks);
		this.store.state.localStorage.set(this.store.state.Player.playerId + "options", this.store.state.Player.options);
		return true;
	}


	const checkHero = async function () {
		this.log.debug('checkHero start');
		if (this.store.state.Player.options.tasks.hero.adventure.enabled) {
			if (this.store.state.Player.hero.time) {
				if (this.store.state.Player.hero.time < new Date().getTime()) {
					this.store.state.Player.hero.status = 0
					this.store.state.Player.hero.adventurePoints = 1
				}
			}
			//status 0=alive, 1 returning, 2 on the way, 7 dead
			if (this.store.state.Player.hero.status == 0 && this.store.state.Player.hero.adventurePoints * 1 > 0) {
				let rez = await this.ApplyActions.adventure(this.store.state.Player, this.store.state.Player.options.tasks.hero.adventure);
			}
		}
		this.log.debug('checkHero end');
	}.bind(this)

	const checkBuild = async function (village) {
		this.log.debug('checkBuild start');
		if (village.BuildingQueueTimes[1] !== undefined && village.BuildingQueueTimes[1] !== 0)
			if (village.BuildingQueueTimes[1] - (new Date().getTime() / 1000) < 300) {
				let rez = await this.ApplyActions.finishNow(village, {
					"queueType": 1
				}, {
					"queueType": 1
				});
			}
		if (village.BuildingQueueTimes[2] !== undefined && village.BuildingQueueTimes[2] !== 0)
			if (village.BuildingQueueTimes[2] - (new Date().getTime() / 1000) < 300) {
				let rez = await this.ApplyActions.finishNow(village, {
					"queueType": 2
				}, {
					"queueType": 2
				});
			}

		let buildtasksToRemove = []
		for (let j = 0; j < village.tasks.build.length; j++) {
			let buildTask = village.tasks.build[j];
			if (!buildTask.enabled)
				continue;
			let locationId = undefined;
			let lowestBuilding = 30;
			let lowestBuilding2 = 30;

			if (buildTask.locationId.length !== undefined) {
				for (let l = 1; l < 19; l++) {
					if (buildTask.locationId.includes(village.buildings[l].buildingType + "")) {
						let villageBuilding = village.buildings[l];
						if (villageBuilding.lvlNext < lowestBuilding2) {
							lowestBuilding2 = villageBuilding.lvlNext
						}
						if (villageBuilding.lvlNext < lowestBuilding && isLowerReources(villageBuilding.upgradeCosts, village.storage) & villageBuilding.lvlNext <= buildTask.toLvl) {
							locationId = l;
							lowestBuilding = villageBuilding.lvlNext;
						}
					}
				}
			} else {
				locationId = buildTask.locationId;
			}

			if (locationId === undefined) {
				if (lowestBuilding2 > buildTask.toLvl) {
					buildtasksToRemove.unshift(j)
				}
				continue;
			}

			if ((village.BuildingQueue["2"] == 0 && locationId <= 18) || (village.BuildingQueue["1"] == 0 && locationId > 18)) {

				continue;
			}
			let villageBuilding = village.buildings[locationId];
			let bt = JSON.parse(JSON.stringify(buildTask));
			bt.locationId = locationId;
			if (village.buildings[locationId].buildingType == 0) {
				let res1 = {
					"1": this.store.state.Buildings[buildTask.buildingType][1][0],
					"2": this.store.state.Buildings[buildTask.buildingType][1][1],
					"3": this.store.state.Buildings[buildTask.buildingType][1][2],
					"4": this.store.state.Buildings[buildTask.buildingType][1][3]
				}

				if (isLowerReources(res1, village.storage)) {
					let rez = await this.ApplyActions.build(village, bt, villageBuilding);
				}
			} else {
				if (villageBuilding.lvlNext == villageBuilding.lvl) {

					buildtasksToRemove.unshift(j)
				} else if (villageBuilding.lvlNext <= buildTask.toLvl) {

					if (isLowerReources(villageBuilding.upgradeCosts, village.storage)) {

						this.log.debug('building started', village, buildTask, villageBuilding);
						let rez = await this.ApplyActions.build(village, bt, villageBuilding);
					}
				} else {
					buildtasksToRemove.unshift(j)
				}
			}
		}

		for (let j = 0; j < buildtasksToRemove.length; j++) {
			this.log.debug('build to remove:', buildtasksToRemove[j]);
			village.tasks.build.splice(buildtasksToRemove[j], 1)
		}

		this.log.debug('checkBuild done');
		return true
	}.bind(this)

	const checkTrade = async function (village) {

		this.log.debug('checkTrade start');
		//updateInncomingResources(village)
		updateMerchants(village)

		if (village.tasks.trade.length == 0) {
			return;
		}
		for (let j = 0; j < village.tasks.trade.length; j++) {

			if (!village.tasks.trade[j].enabled)
				continue;

			let resources = village.tasks.trade[j].resources;
			if (village.tasks.trade[j].time > new Date().getTime()) {
				continue;
			}
			//Pre trade
			switch (village.tasks.trade[j].type) {
				case "1x":
					break;
				case "Return":
					break;
			}
			if (village.tasks.trade[j].type == "Send by %") {
				resources = resourcesToBeSentByPercent(village, village.tasks.trade[j]);
				resources = { "1": resources[0], "2": resources[1], "3": resources[2], "4": resources[3] };
			}

			if (village.Merchants.maxCapacity >= sumResources(resources) && isLowerReources(resources, village.storage) && sumResources(resources) > 0) {
				let rez = await this.ApplyActions.trade(village, village.tasks.trade[j], resources);

				if (village.tasks.trade[j].type == "Every x minutes") {
					village.tasks.trade[j].time = new Date().getTime() + village.tasks.trade[j].repeatinterval * 60000
				}
				else if (village.tasks.trade[j].type == "Return") {
					village.tasks.trade[j].time = new Date().getTime() + (distance(village.x, village.y, village.tasks.trade[j].x, village.tasks.trade[j].y) / village.Merchants.speed) * 60 * 60 * 1000 * 2;
				}
				if (!rez) {
					return;
				}
				//Post trade
				switch (village.tasks.trade[j].type) {
					case "1x":
						village, village.tasks.trade.splice(j, 1);
						break;
					case "Return":

						break;
				}
				//}
			}



		}

		this.log.debug('checkTrade done');
	}.bind(this)

	const checkTrain = async function (village) {

		this.log.debug('checkTrain start');
		for (let j = 0; j < village.tasks.train.length; j++) {

			if (!village.tasks.train[j].enabled)
				continue;
			if (village.tasks.train[j].time > new Date().getTime()) {
				continue;
			}
			village.tasks.train[j].type = ((this.store.state.Player.tribeId - 1) * 10) + (village.tasks.train[j].type * 1 % 10);
			let t = village.tasks.train[j].type % 10;

			let resources = {};
			if (this.store.state.Player.version === 5) {
				resources["1"] = this.store.state.troopCost[t].costs[1] * village.tasks.train[j].amount;
				resources["2"] = this.store.state.troopCost[t].costs[2] * village.tasks.train[j].amount;
				resources["3"] = this.store.state.troopCost[t].costs[3] * village.tasks.train[j].amount;
				resources["4"] = this.store.state.troopCost[t].costs[4] * village.tasks.train[j].amount;
			} else {
				resources["1"] = this.store.state.uc[t][1] * village.tasks.train[j].amount;
				resources["2"] = this.store.state.uc[t][2] * village.tasks.train[j].amount;
				resources["3"] = this.store.state.uc[t][3] * village.tasks.train[j].amount;
				resources["4"] = this.store.state.uc[t][4] * village.tasks.train[j].amount;
			}

			if (isLowerReources(resources, village.storage)) {

				let buildingType = 0;
				let building = undefined;
				if (t == 1 || t == 2 || t == 3) {
					buildingType = 19;
				} else if (t == 4 || t == 5 || t == 6) {
					buildingType = 20;
				} else if (t == 7 || t == 8) {
					buildingType = 21;
				} else if (t == 9 || t == 0) {

					buildingType = 25;
					for (let b = 0; b < village.buildings.length; b++) {
						if (village.buildings[b].buildingType == 26) {
							buildingType = 26;
						}
					}
				}
				//teutons
				if (this.store.state.Player.tribeId * 1 == 2 && t == 4) {
					buildingType = 19;
				}
				//gauls
				if ((this.store.state.Player.tribeId * 1 == 3 || this.store.state.Player.tribeId * 1 == 7) && t == 3) {
					buildingType = 20;
				}

				for (let b = 0; b < village.buildings.length; b++) {
					if (village.buildings[b].buildingType == buildingType) {
						building = village.buildings[b];
					}
				}

				if (building !== undefined) {
					let rez = await this.ApplyActions.train(village, village.tasks.train[j], resources, building);
					village.tasks.train[j].time = new Date().getTime() + village.tasks.train[j].timeMinutes * 60 * 1000;
				}
			}
		}

		this.log.debug('checkTrain done');
	}.bind(this)

	const checkFarm = async function (village) {
		this.log.debug('checkFarm start');
		for (let j = 0; j < village.tasks.farms.length; j++) {

			if (!village.tasks.farms[j].enabled)
				continue;
			if (village.tasks.farms[j].time > new Date().getTime()) {
				continue;
			}
			if (!village.tasks.farms[j].goldClubFarmlist) {
				for (let f = village.tasks.farms[j].farmPosition; f < village.tasks.farms[j].villages.length; f++) {

					if (!village.tasks.farms[j].villages[f].enabled)
						continue;
					if (isLowerFarms(village.tasks.farms[j].amount, village.Troops) || this.store.state.Player.version == 4) {
						let rez = await this.ApplyActions.farm(village, village.tasks.farms[j].villages[f], village.tasks.farms[j]);

						if (rez === undefined) {
							break;
						}
						if (rez.fail) {
							break;
						}
						village.tasks.farms[j].farmPosition = f;
					}
				}

				if (village.tasks.farms[j].farmPosition == (village.tasks.farms[j].villages.length - 1)) {
					village.tasks.farms[j].farmPosition = 0;
				}
			} else {
				let rez = await this.ApplyActions.farmGoldClub(village, village.tasks.farms[j]);

			}
			village.tasks.farms[j].timeMinutes *= 1;
			let randomMinutes = village.tasks.farms[j].timeMinutes;
			if (village.tasks.farms[j].timeMinutesMax !== undefined) {
				village.tasks.farms[j].timeMinutesMax *= 1;
				if (village.tasks.farms[j].timeMinutesMax > village.tasks.farms[j].timeMinutes) {

					randomMinutes = Math.floor(Math.random() * (village.tasks.farms[j].timeMinutesMax - village.tasks.farms[j].timeMinutes)) + village.tasks.farms[j].timeMinutes;
				}
			}

			village.tasks.farms[j].time = new Date().getTime() + randomMinutes * 60 * 1000;
		}

		this.log.debug('checkFarm done');
	}.bind(this)

	const resourcesToBeSentByPercent = function (village, task) {
		let targetvillage = getVillageFromXY(task.x, task.y);

		let SkupajSurovinZaPosiljanje = village.Merchants.maxCapacity;

		let SkupajLes1 = village["storage"]["1"];
		let SkupajGlina1 = village["storage"]["2"];
		let SkupajZelezo1 = village["storage"]["3"];
		let SkupajZito1 = village["storage"]["4"];

		let PolnoLes1 = SkupajLes1 / village["storageCapacity"]["1"];
		let PolnoGlina1 = SkupajGlina1 / village["storageCapacity"]["2"];
		let PolnoZelezo1 = SkupajZelezo1 / village["storageCapacity"]["3"];
		let PolnoZito1 = SkupajZito1 / village["storageCapacity"]["4"];
		let PolnoLes2 = 0;
		let PolnoGlina2 = 0;
		let PolnoZelezo2 = 0;
		let PolnoZito2 = 0;
		let capacity = { "1": 1000000000, "2": 1000000000, "3": 1000000000, "4": 1000000000 };

		if (targetvillage) {
			updateInncomingResources(targetvillage)
			let incommingRes = getInncomingResources(targetvillage);
			let SkupajLes2 = targetvillage["storage"]["1"] + incommingRes[0];
			let SkupajGlina2 = targetvillage["storage"]["2"] + incommingRes[1];
			let SkupajZelezo2 = targetvillage["storage"]["3"] + incommingRes[2];
			let SkupajZito2 = targetvillage["storage"]["4"] + incommingRes[3];

			PolnoLes2 = SkupajLes2 / targetvillage["storageCapacity"]["1"];
			PolnoGlina2 = SkupajGlina2 / targetvillage["storageCapacity"]["2"];
			PolnoZelezo2 = SkupajZelezo2 / targetvillage["storageCapacity"]["3"];
			PolnoZito2 = SkupajZito2 / targetvillage["storageCapacity"]["4"];
			capacity = targetvillage["storageCapacity"];

		}

		if ((task["empty"]["1"] / 100 < PolnoLes1 || task["empty"]["2"] / 100 < PolnoGlina1 || task["empty"]["3"] / 100 < PolnoZelezo1 || task["empty"]["4"] / 100 < PolnoZito1)
			&& (task["fill"]["1"] / 100 > PolnoLes2 || task["fill"]["2"] / 100 > PolnoGlina2 || task["fill"]["3"] / 100 > PolnoZelezo2 || task["fill"]["4"] / 100 > PolnoZito2)) {

			let LesKiGaLahkoPosljem = 0;
			let GlinaKiGaLahkoPosljem = 0;
			let ZelezoKiGaLahkoPosljem = 0;
			let ZitoKiGaLahkoPosljem = 0;
			if (task["empty"]["1"] / 100 < PolnoLes1 && task["fill"]["1"] / 100 > PolnoLes2) {
				let LesKiGaLahkoPosljem1 = Math.floor((PolnoLes1 - task["empty"]["1"] / 100) * village["storageCapacity"]["1"]);
				let LesKiGaLahkoPosljem2 = Math.floor((task["fill"]["1"] / 100 - PolnoLes2) * capacity["1"]);
				LesKiGaLahkoPosljem = Math.min(LesKiGaLahkoPosljem1, LesKiGaLahkoPosljem2);
			}
			if (task["empty"]["2"] / 100 < PolnoGlina1 && task["fill"]["2"] / 100 > PolnoGlina2) {
				let GlinaKiGaLahkoPosljem1 = Math.floor((PolnoGlina1 - task["empty"]["2"] / 100) * village["storageCapacity"]["2"]);
				let GlinaKiGaLahkoPosljem2 = Math.floor((task["fill"]["2"] / 100 - PolnoGlina2) * capacity["2"]);
				GlinaKiGaLahkoPosljem = Math.min(GlinaKiGaLahkoPosljem1, GlinaKiGaLahkoPosljem2);
			}

			if (task["empty"]["3"] / 100 < PolnoZelezo1 && task["fill"]["3"] / 100 > PolnoZelezo2) {
				let ZelezoKiGaLahkoPosljem1 = Math.floor((PolnoZelezo1 - task["empty"]["3"] / 100) * village["storageCapacity"]["3"]);
				let ZelezoKiGaLahkoPosljem2 = Math.floor((task["fill"]["3"] / 100 - PolnoZelezo2) * capacity["3"]);
				ZelezoKiGaLahkoPosljem = Math.min(ZelezoKiGaLahkoPosljem1, ZelezoKiGaLahkoPosljem2);
			}

			if (task["empty"]["4"] / 100 < PolnoZito1 && task["fill"]["4"] / 100 > PolnoZito2) {
				let ZitoKiGaLahkoPosljem1 = Math.floor((PolnoZito1 - task["empty"]["4"] / 100) * village["storageCapacity"]["4"]);
				let ZitoKiGaLahkoPosljem2 = Math.floor((task["fill"]["4"] / 100 - PolnoZito2) * capacity["4"]);
				ZitoKiGaLahkoPosljem = Math.min(ZitoKiGaLahkoPosljem1, ZitoKiGaLahkoPosljem2);
			}

			let vsotaSurovin = LesKiGaLahkoPosljem + GlinaKiGaLahkoPosljem + ZelezoKiGaLahkoPosljem + ZitoKiGaLahkoPosljem;
			let ProcentiLes = LesKiGaLahkoPosljem / vsotaSurovin;
			let ProcentiGlina = GlinaKiGaLahkoPosljem / vsotaSurovin;
			let ProcentiZelezo = ZelezoKiGaLahkoPosljem / vsotaSurovin;
			let ProcentiZito = ZitoKiGaLahkoPosljem / vsotaSurovin;
			vsotaSurovin = Math.min(vsotaSurovin, SkupajSurovinZaPosiljanje);

			if (vsotaSurovin == 0) {
				return [0, 0, 0, 0];
			}
			let surovine = [Math.floor(ProcentiLes * vsotaSurovin), Math.floor(ProcentiGlina * vsotaSurovin), Math.floor(ProcentiZelezo * vsotaSurovin), Math.floor(ProcentiZito * vsotaSurovin)];
			let maxsurovin = [LesKiGaLahkoPosljem, GlinaKiGaLahkoPosljem, ZelezoKiGaLahkoPosljem, ZitoKiGaLahkoPosljem];
			let zaokrozene = RoundTrade(surovine, maxsurovin, [village["Merchants"]["merchantsFree"], village["Merchants"]["carry"]], task["minres"], task["round"], task["full"]);
			return zaokrozene;
		}

		return [0, 0, 0, 0];
	}

	const getInncomingResources = function (village) {
		let res = [0, 0, 0, 0]
		let timenow = new Date().getTime()
		for (let i = 0; i < village["troopsMoving"].length; i++) {
			if (village["troopsMoving"][i]["movementType"] * 1 == 7 && village["troopsMoving"][i]["villageIdTarget"] * 1 == village.villageId * 1) {
				res[0] += village["troopsMoving"][i]["resources"]["1"];
				res[1] += village["troopsMoving"][i]["resources"]["2"];
				res[2] += village["troopsMoving"][i]["resources"]["3"];
				res[3] += village["troopsMoving"][i]["resources"]["4"];
			}
		}
		return res;
	}

	const updateInncomingResources = function (village) {
		let res = [0, 0, 0, 0]
		let toRemove = []
		let timenow = new Date().getTime()
		for (let i = 0; i < village["troopsMoving"].length; i++) {
			if (village["troopsMoving"][i]["movementType"] * 1 == 7 && village["troopsMoving"][i]["villageIdTarget"] * 1 == village.villageId * 1 && village["troopsMoving"][i]["timeFinish"] * 1 <= timenow) {
				toRemove.splice(0, 0, i)
				res[0] += village["troopsMoving"][i]["resources"]["1"]
				res[1] += village["troopsMoving"][i]["resources"]["2"]
				res[2] += village["troopsMoving"][i]["resources"]["3"]
				res[3] += village["troopsMoving"][i]["resources"]["4"]
			}
		}
		village["storage"]["1"] += res[0]
		village["storage"]["2"] += res[1]
		village["storage"]["3"] += res[2]
		village["storage"]["4"] += res[3]
		for (let i = 0; i < toRemove.length; i++) {
			village["troopsMoving"].splice(toRemove[i], 1)
		}
	}

	const updateMerchants = function (village) {
		let trg = 0
		let toRemove = []
		let timenow = new Date().getTime()
		for (let i = 0; i < village["TRGOVCI"].length; i++) {
			if (village["TRGOVCI"][i]["time"] * 1 <= timenow) {
				toRemove.splice(0, 0, i)
				trg += village["TRGOVCI"][i]["trgovci"]
			}
		}
		village["Merchants"]["merchantsFree"] = Math.min(village["Merchants"]["merchantsFree"] + trg, village["Merchants"]["max"])
		for (let i = 0; i < toRemove.length; i++) {
			village["TRGOVCI"].splice(toRemove[i], 1)
		}
	}

	const getVillageFromXY = function (x, y) {
		for (let i = 0; i < this.store.state.Player.villages.length; i++) {
			if (this.store.state.Player.villages[i]["x"] == x && this.store.state.Player.villages[i]["y"] == y) {
				return this.store.state.Player.villages[i]
			}
		}
		return false
	}.bind(this)


	function Vsota(polje) {
		let vsota = 0;
		for (let i = 0; i < polje.length; i++) {
			vsota += polje[i] * 1;
		}
		return vsota;
	}

	const RoundTrade = function (surovine, maxsurovine, trgovci, minsurovin, zaokrozitev, polnitrgovci) {

		let wood = surovine[0];
		let clay = surovine[1];
		let iron = surovine[2];
		let crop = surovine[3];
		let woodMax = maxsurovine[0];
		let clayMax = maxsurovine[1];
		let ironMax = maxsurovine[2];
		let cropMax = maxsurovine[3];
		if (!(zaokrozitev == 10 || zaokrozitev == 100 || zaokrozitev == 1000)) {
			zaokrozitev = 100;
		}
		wood = Math.floor(wood / zaokrozitev) * zaokrozitev;
		clay = Math.floor(clay / zaokrozitev) * zaokrozitev;
		iron = Math.floor(iron / zaokrozitev) * zaokrozitev;
		crop = Math.floor(crop / zaokrozitev) * zaokrozitev;
		let sumResources = wood + clay + iron + crop;
		if (polnitrgovci) {
			//add resources to fill trade task
			let resourcesLeft = trgovci[1] - (sumResources % trgovci[1]);
			let change = true;
			if (sumResources / trgovci[1] < trgovci[0]) {
				while (resourcesLeft > 0 && change) {
					change = false;
					if (woodMax - wood >= zaokrozitev && resourcesLeft > 0) {
						wood += zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						change = true;
					}
					if (clayMax - clay >= zaokrozitev && resourcesLeft > 0) {
						clay += zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						change = true;
					}
					if (ironMax - iron >= zaokrozitev && resourcesLeft > 0) {
						iron += zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						change = true;
					}
					if (cropMax - crop >= zaokrozitev && resourcesLeft > 0) {
						crop += zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
						change = true;
					}
				}
			}
			//remove resources in case of multiple trades when resources are over
			sumResources = wood + clay + iron + crop;
			if (sumResources / trgovci[1] > 1) {

				if (polnitrgovci) {
					resourcesLeft = sumResources % trgovci[1];
				} else {
					resourcesLeft = 0;
				}

				if (sumResources / trgovci[1] > trgovci[0]) {
					resourcesLeft = sumResources - trgovci[1] * trgovci[0];
				}
				if (trgovci[1] !== resourcesLeft) {
					change = true;
					while (resourcesLeft > 0 && change) {
						change = false;

						if (wood >= zaokrozitev && resourcesLeft > 0) {
							wood -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							change = true;
						}
						if (clay >= zaokrozitev && resourcesLeft > 0) {
							clay -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							change = true;
						}
						if (iron >= zaokrozitev && resourcesLeft > 0) {
							iron -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							change = true;
						}
						if (crop >= zaokrozitev && resourcesLeft > 0) {
							crop -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							resourcesLeft -= zaokrozitev < resourcesLeft ? zaokrozitev : resourcesLeft;
							change = true;
						}
					}
				}
			}
		}

		if ((wood + clay + iron + crop) > minsurovin) {
			return [wood, clay, iron, crop];
		}

		return [0, 0, 0, 0];
	}


	function sumResources(res1) {
		return res1["1"] * 1 + res1["2"] * 1 + res1["3"] * 1 + res1["4"] * 1;
	}

	function isLowerReources(res1, res2) {
		return res1["1"] * 1 < res2["1"] * 1 && res1["2"] * 1 < res2["2"] * 1 && res1["3"] * 1 < res2["3"] * 1 && res1["4"] * 1 < res2["4"] * 1;
	}

	function isLowerFarms(res1, res2) {
		return res1["1"] * 1 <= res2["1"] * 1 && res1["2"] * 1 <= res2["2"] * 1 && res1["3"] * 1 <= res2["3"] * 1 && res1["4"] * 1 <= res2["4"] * 1 && res1["5"] * 1 <= res2["5"] * 1 && res1["6"] * 1 <= res2["6"] * 1 && res1["7"] * 1 <= res2["7"] * 1 && res1["8"] * 1 <= res2["8"] * 1;
	}

	function distance(x1, y1, x2, y2) {
		return Math.sqrt(((x2 * 1 - x1 * 1) * (x2 * 1 - x1 * 1)) + ((y2 * 1 - y1 * 1) * (y2 * 1 - y1 * 1)));
	}
	const reportError = function (e, type) {
		/*this.socket.emit('ERROR', {
			"type": "checkFarm",
			"error": exceptionToString(e)
		});*/
	}.bind(this)

	const keysToWrap = [
		"getPlayer",
		"analyzePlayer",
		"build",
		"finishNow",
		"trade",
		"train",
		"adventure",
		"farm",
		"search",
		"cropFind",
		"onRouted",
		"getGoldClubFarmlists",
		"farmGoldClub",
		"coppyFarmlist",
		"logout",
		"loginCustom",
		"analyzeBuildings",
		"analyzeVillage"
	];
	const tasksToCheckActivity = [
		"build",
		"trade",
		"train",
		"adventure",
		"farm"
	];

	const wrapObjectFunctions = function (obj, before, after) {
		let key, value;

		for (key in obj) {
			value = obj[key];
			if (typeof value === "function") {
				if (keysToWrap.includes(key)) {
					wrapFunction(obj, key, value);
				}
			}
		}

		function wrapFunction(obj, fname, f) {
			return obj[fname] = async function () {
				let rv;
				if (before) {
					try {
						rv = await before(fname, this, arguments);
					} catch (ex) {
						rv = false;
						console.log(ex);
					}
				}
				if (rv) {
					rv = await f.apply(this, arguments); // Calls the original
				}

				if (after) {
					try {
						await after(fname, this, arguments, rv);
					} catch (ex) {
						console.log(ex);
					}
				}
				return rv;
			};
		}
	}.bind(this)

	function copyProperties(main, other) {
		if (other != undefined) {
			for (let key in main) {
				if (other[key] !== undefined) {
					// Handle Array
					if (key == "lang") {
						continue;
					}
					if (Array.isArray(other[key])) {
						let arrayOther = other[key];
						let arrayMain = main[key];
						if (arrayMain !== undefined) {
							for (let i = 0, len = arrayOther.length; i < len; i++) {
								if (arrayMain[i] !== undefined) {
									copyProperties(arrayMain[i], arrayOther[i]);
								} else {
									switch (key) {
										case "village":
											arrayMain[i] = JSON.parse(JSON.stringify(this.store.state.Village));
											arrayMain[i].tasks.villageId = arrayMain[i].villageId;
											copyProperties(arrayMain[i], arrayOther[i]);
											break;
										default:
											arrayMain[i] = arrayOther[i];
											break;
									}
								}
							}
							for (let i = arrayMain.length - 1; i >= 0; i--) {
								if (arrayOther[i] === undefined) {
									arrayMain.splice(i, 1);
								}
							}
						}
					} else if (typeof main[key] === 'object') {
						copyProperties(main[key], other[key])
					} else {
						if (main[key] !== other[key]) {
							main[key] = other[key];
						}
					}
				}
			}
		}
	}

	async function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

export default new exports();