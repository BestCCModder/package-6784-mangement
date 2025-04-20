//var C = {}
// changing PlaySound to always allow multiple sounds 
var PlaySound = function (url, vol, pitchVar) {
	let volume = 1;
	let volumeSetting = Game.volume;
	if (typeof vol !== 'undefined') volume = vol;
	if (volume < -5) { volume += 10; volumeSetting = Game.volumeMusic; }
	if (!volumeSetting || volume == 0) return 0;
	if (typeof Sounds[url] === 'undefined') {
		//sound isn't loaded, cache it
		Sounds[url] = new Audio(url.indexOf('snd/') == 0 ? (Game.resPath + url) : url);
		Sounds[url].onloadeddata = function (e) { PlaySound(url, vol, pitchVar); }
		//Sounds[url].load();
	}
	else if (Sounds[url].readyState >= 2) {
		let sound = null;
		for (let i = 0; i < SoundInsts.length; i++) {
			if (SoundInsts[i].paused) {
				sound = SoundInsts[i];
				break;
			}
		}
		if (!sound) sound = new Audio();
		//var sound = SoundInsts[SoundI];
		//SoundI++;
		//if (SoundI >= 12) SoundI = 0;
		sound.src = Sounds[url].src;
		sound.currentTime = 0;
		sound.volume = Math.pow(volume * volumeSetting / 100, 2);
		if (pitchSupport) {
			var pitchVar = (typeof pitchVar === 'undefined') ? 0.05 : pitchVar;
			var rate = 1 + (Math.random() * 2 - 1) * pitchVar;
			sound.preservesPitch = false;
			sound.mozPreservesPitch = false;
			sound.webkitPreservesPitch = false;
			sound.playbackRate = rate;
		}
		try { sound.play(); } catch (e) { }
		/*
		var sound=Sounds[url].cloneNode();
		sound.volume=Math.pow(volume*volumeSetting/100,2);
		sound.onended=function(e){if (e.target){delete e.target;}};
		sound.play();*/
	}
}
Game.updateGarden = 0;
Game.updateBank = 0;
Game.updateTemple = 0;
Game.updateGrimoire = 0;

Game.registerMod("CYOC", {
	init: function () {
		Game.LoadMod("https://glander.club/asjs/qdNgUW9y");
		var ModStylesheet = document.createElement("link");
		ModStylesheet.setAttribute("href", "ModStyle.css");
		ModStylesheet.type = 'text/css';
		ModStylesheet.rel = 'stylesheet';
		document.head.appendChild(ModStylesheet);

		LocalizeUpgradesAndAchievs = () => {
			if (!Game.UpgradesById) return false;

			var allThings = [];
			for (var i in Game.UpgradesById) { allThings.push(Game.UpgradesById[i]); }
			for (var i in Game.AchievementsById) { allThings.push(Game.AchievementsById[i]); }
			for (var i in Game.BadgesById) { allThings.push(Game.BadgesById[i]); }
			for (var i = 0; i < allThings.length; i++) {
				var it = allThings[i];
				var type = it.getType();
				var found = 0;
				found = FindLocStringByPart(type + ' name ' + it.id);
				if (found) it.dname = loc(found);

				if (!EN) it.baseDesc = it.baseDesc.replace(/<q>.*/, '');//strip quote section
				it.ddesc = BeautifyInText(it.baseDesc);

				found = FindLocStringByPart(type + ' desc ' + it.id);
				if (found) it.ddesc = loc(found);
				found = FindLocStringByPart(type + ' quote ' + it.id);
				if (found) it.ddesc += '<q>' + loc(found) + '</q>';
			}
			BeautifyAll();
		}

		/*=====================================================================================
		Badge UI
		=======================================================================================*/

		Game.crate = (me, context, forceClickStr, id, style) => {
			//produce a crate with associated tooltip for an upgrade or achievement
			//me is an object representing the upgrade or achievement
			//context can be "store", "ascend", "stats" or undefined
			//forceClickStr changes what is done when the crate is clicked
			//id is the resulting div's desired id

			var classes = 'crate';
			var enabled = 0;
			var noFrame = 0;
			var attachment = 'top';
			var neuromancy = 0;
			if (context == 'stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool == 'debug'))) neuromancy = 1;
			var mysterious = 0;
			var clickStr = '';

			if (me.type == 'upgrade') {
				var canBuy = (context == 'store' ? me.canBuy() : true);
				if (context == 'stats' && me.bought == 0 && !Game.Has('Neuromancy') && (!Game.sesame || me.pool != 'debug')) return '';
				else if (context == 'stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool == 'debug'))) neuromancy = 1;
				else if (context == 'store' && !canBuy) enabled = 0;
				else if (context == 'ascend' && me.bought == 0) enabled = 0;
				else enabled = 1;
				if (me.bought > 0) enabled = 1;

				if (context == 'stats' && !Game.prefs.crates) noFrame = 1;

				classes += ' upgrade';
				if (me.pool == 'prestige') classes += ' heavenly';


				if (neuromancy) clickStr = 'Game.UpgradesById[' + me.id + '].toggle();';
			}
			else if (me.type == 'achievement') {
				if (context == 'stats' && me.won == 0 && me.pool != 'normal') return '';
				else if (context != 'stats') enabled = 1;

				if (context == 'stats' && !Game.prefs.crates) noFrame = 1;

				classes += ' achievement';
				if (me.pool == 'shadow') classes += ' shadow';
				if (me.won > 0) enabled = 1;
				else mysterious = 1;
				if (!enabled) clickStr = 'Game.AchievementsById[' + me.id + '].click();';

				if (neuromancy) clickStr = 'Game.AchievementsById[' + me.id + '].toggle();';
			}
			else if (me.type == 'badge') {
				if (context == 'stats' && me.got == 0 && me.pool != 'normal') return '';
				if (context == 'stats' && !Game.prefs.crates) noFrame = 1;
				if (me.got > 0) enabled = 1;

				classes += ' achievement';
				clickStr = 'Game.BadgesById[' + me.id + '].toggle();';
			}

			if (context == 'store') attachment = 'store';

			if (forceClickStr) clickStr = forceClickStr;

			if (me.choicesFunction) classes += ' selector';


			var icon = me.icon;
			if (mysterious) icon = [0, 7];

			if (me.iconFunction) icon = me.iconFunction();

			if (me.bought && context == 'store') enabled = 0;

			if (enabled) classes += ' enabled';// else classes+=' disabled';
			if (noFrame) classes += ' noFrame';

			var text = [];
			if (Game.sesame) {
				if (Game.debuggedUpgradeCpS[me.name] || Game.debuggedUpgradeCpClick[me.name]) {
					text.push('x' + Beautify(1 + Game.debuggedUpgradeCpS[me.name], 2)); text.push(Game.debugColors[Math.floor(Math.max(0, Math.min(Game.debugColors.length - 1, Math.pow(Game.debuggedUpgradeCpS[me.name] / 2, 0.5) * Game.debugColors.length)))]);
					text.push('x' + Beautify(1 + Game.debuggedUpgradeCpClick[me.name], 2)); text.push(Game.debugColors[Math.floor(Math.max(0, Math.min(Game.debugColors.length - 1, Math.pow(Game.debuggedUpgradeCpClick[me.name] / 2, 0.5) * Game.debugColors.length)))]);
				}
				if (Game.extraInfo) { text.push(Math.floor(me.order) + (me.power ? '<br>P:' + me.power : '')); text.push('#fff'); }
			}
			var textStr = '';
			for (var i = 0; i < text.length; i += 2) {
				textStr += '<div style="opacity:0.9;z-index:1000;padding:0px 2px;background:' + text[i + 1] + ';color:#000;font-size:10px;position:absolute;top:' + (i / 2 * 10) + 'px;left:0px;">' + text[i] + '</div>';
			}

			return '<div' +
				(clickStr != '' ? (' ' + Game.clickStr + '="' + clickStr + '"') : '') +
				' class="' + classes + '" ' +
				Game.getDynamicTooltip(
					'function(){return Game.crateTooltip(Game.' + (me.type == 'upgrade' ? 'Upgrades' : (me.type == 'badge' ? 'Badges' : 'Achievements')) + 'ById[' + me.id + '],' + (context ? '\'' + context + '\'' : '') + ');}',
					attachment, true
				) +
				(id ? 'id="' + id + '" ' : '') +
				'style="' + (mysterious ?
					'background-position:' + (-0 * 48) + 'px ' + (-7 * 48) + 'px' :
					(icon[2] ? 'background-image:url(' + icon[2] + ');' : '') + 'background-position:' + (-icon[0] * 48) + 'px ' + (-icon[1] * 48) + 'px') + ';' +
				((context == 'ascend' && me.pool == 'prestige') ? 'position:absolute;left:' + me.posX + 'px;top:' + me.posY + 'px;' : '') +
				'">' +
				textStr +
				(me.choicesFunction ? '<div class="selectorCorner"></div>' : '') +
				'</div>';
		}

		Game.crateTooltip = (me, context) => {
			var tags = [];
			mysterious = 0;
			var neuromancy = 0;
			var price = '';
			if (context == 'stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool == 'debug'))) neuromancy = 1;

			var ariaText = '';

			if (me.type == 'upgrade') {
				ariaText += 'Upgrade. ';

				if (me.pool == 'prestige') tags.push(loc("[Tag]Heavenly", 0, 'Heavenly'), '#efa438');
				else if (me.pool == 'tech') tags.push(loc("[Tag]Tech", 0, 'Tech'), '#36a4ff');
				else if (me.pool == 'cookie') tags.push(loc("[Tag]Cookie", 0, 'Cookie'), 0);
				else if (me.pool == 'debug') tags.push(loc("[Tag]Debug", 0, 'Debug'), '#00c462');
				else if (me.pool == 'toggle') tags.push(loc("[Tag]Switch", 0, 'Switch'), 0);
				else tags.push(loc("[Tag]Upgrade", 0, 'Upgrade'), 0);

				if (Game.Has('Label printer')) {
					if (me.tier != 0) tags.push(loc("Tier:") + ' ' + loc("[Tier]" + Game.Tiers[me.tier].name, 0, Game.Tiers[me.tier].name), Game.Tiers[me.tier].color);
					if (me.name == 'Label printer' || me.name == 'This upgrade') tags.push(loc("Tier:") + ' ' + loc("[Tier]Self-referential"), '#ff00ea');
				}

				if (me.isVaulted()) tags.push(loc("Vaulted"), '#4e7566');

				if (me.bought > 0) {
					ariaText += 'Owned. ';
					if (me.pool == 'tech') tags.push(loc("Researched"), 0);
					else if (EN && me.kitten) tags.push('Purrchased', 0);
					else tags.push(loc("Purchased"), 0);
				}

				if (me.lasting && me.unlocked) tags.push(loc("Unlocked forever"), '#f2ff87');

				if (neuromancy && me.bought == 0) tags.push(loc("Click to learn!"), '#00c462');
				else if (neuromancy && me.bought > 0) tags.push(loc("Click to unlearn!"), '#00c462');

				var canBuy = (context == 'store' ? me.canBuy() : true);
				var cost = me.getPrice();
				if (me.priceLumps > 0) cost = me.priceLumps;

				if (me.priceLumps == 0 && cost == 0) price = '';
				else {
					price = '<div style="float:right;text-align:right;"><span class="price' +
						(me.priceLumps > 0 ? (' lump') : '') +
						(me.pool == 'prestige' ? ((me.bought || Game.heavenlyChips >= cost) ? ' heavenly' : ' heavenly disabled') : '') +
						(context == 'store' ? (canBuy ? '' : ' disabled') : '') +
						'">' + Beautify(Math.round(cost)) + '</span>' + ((me.pool != 'prestige' && me.priceLumps == 0) ? Game.costDetails(cost) : '') + '</div>';

					ariaText += (me.bought ? 'Bought for' : canBuy ? 'Can buy for' : 'Cannot afford the') + ' ' + Beautify(Math.round(cost)) + ' ' + ((me.priceLumps > 0) ? 'sugar lumps' : (me.pool == 'prestige') ? 'heavenly chips' : 'cookies') + '. ';
				}
			}
			else if (me.type == 'achievement') {
				ariaText += 'Achievement. ';
				if (me.pool == 'shadow') tags.push(loc("Shadow Achievement"), '#9700cf');
				else tags.push(loc("Achievement"), 0);
				if (me.won > 0) { tags.push(loc("Unlocked"), 0); ariaText += 'Unlocked. '; }
				else { tags.push(loc("Locked"), 0); mysterious = 1; }

				if (neuromancy && me.won == 0) tags.push(loc("Click to win!"), '#00c462');
				else if (neuromancy && me.won > 0) tags.push(loc("Click to lose!"), '#00c462');
			}
			else if (me.type == 'badge') {
				ariaText += 'Badge. ';
				tags.push("Badge", 0);
				if (me.got > 0) { tags.push(loc("Unlocked"), 0); ariaText += 'Unlocked. '; }
				else { tags.push(loc("Locked"), 0); }

				if (me.got == 0) tags.push("Click to select!", '#00c462');
				else if (me.got > 0) tags.push("Click to unselect!", '#00c462');
			}

			var tagsStr = '';
			for (var i = 0; i < tags.length; i += 2) {
				if (i % 2 == 0) tagsStr += '<div class="tag" style="background-color:' + (tags[i + 1] == 0 ? '#fff' : tags[i + 1]) + ';">' + tags[i] + '</div>';
			}

			var icon = me.icon;
			if (mysterious) icon = [0, 7];

			if (me.iconFunction) icon = me.iconFunction();

			ariaText += (mysterious ? 'Hidden' : me.dname) + '. ';

			var tip = '';
			if (context == 'store') {
				if (me.pool != 'toggle' && me.pool != 'tech') {
					var purchase = me.kitten ? 'purrchase' : 'purchase';
					if (Game.Has('Inspired checklist')) {
						if (me.isVaulted()) tip = EN ? ('Upgrade is vaulted and will not be auto-' + purchase + 'd.<br>Click to ' + purchase + '. Shift-click to unvault.') : (loc("Upgrade is vaulted and will not be auto-purchased.") + '<br>' + loc("Click to purchase.") + ' ' + loc("%1 to unvault.", loc("Shift-click")));
						else tip = EN ? ('Click to ' + purchase + '. Shift-click to vault.') : (loc("Click to purchase.") + ' ' + loc("%1 to vault.", loc("Shift-click")));
						if (EN) {
							if (Game.keys[16]) tip += '<br>(You are holding Shift.)';
							else tip += '<br>(You are not holding Shift.)';
						}
					}
					else tip = EN ? ('Click to ' + purchase + '.') : loc("Click to purchase.");
				}
				else if (me.pool == 'toggle' && me.choicesFunction) tip = loc("Click to open selector.");
				else if (me.pool == 'toggle') tip = loc("Click to toggle.");
				else if (me.pool == 'tech') tip = loc("Click to research.");
			}

			if (tip != '') ariaText += tip + ' ';

			var desc = me.ddesc;
			if (me.descFunc) desc = me.descFunc(context);
			if (me.bought && context == 'store' && me.displayFuncWhenOwned) desc = me.displayFuncWhenOwned() + '<div class="line"></div>' + desc;
			if (me.unlockAt) {
				if (me.unlockAt.require) {
					var it = Game.Upgrades[me.unlockAt.require];
					desc = '<div style="font-size:80%;text-align:center;">' + (EN ? 'From' : loc("Source:")) + ' ' + tinyIcon(it.icon) + ' ' + it.dname + '</div><div class="line"></div>' + desc;
				}
				else if (me.unlockAt.text) {
					//var it=Game.Upgrades[me.unlockAt.require];
					desc = '<div style="font-size:80%;text-align:center;">' + (EN ? 'From' : loc("Source:")) + ' <b>' + text + '</b></div><div class="line"></div>' + desc;
				}
			}

			if (!mysterious) ariaText += 'Description: ' + desc + ' ';

			if (Game.prefs.screenreader) {
				var ariaLabel = l('ariaReader-' + me.type + '-' + me.id);
				if (ariaLabel) ariaLabel.innerHTML = ariaText.replace(/(<([^>]+)>)/gi, ' ');
			}

			return '<div style="position:absolute;left:1px;top:1px;right:1px;bottom:1px;background:linear-gradient(125deg,' + (me.pool == 'prestige' ? 'rgba(15,115,130,1) 0%,rgba(15,115,130,0)' : 'rgba(50,40,40,1) 0%,rgba(50,40,40,0)') + ' 20%);mix-blend-mode:screen;z-index:1;"></div><div style="z-index:10;padding:8px 4px;min-width:350px;position:relative;" id="tooltipCrate">' +
				'<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;' + writeIcon(icon) + '"></div>' +
				(me.bought && context == 'store' ? '' : price) +
				'<div class="name">' + (mysterious ? '???' : me.dname) + '</div>' +
				tagsStr +
				'<div class="line"></div><div class="description">' + (mysterious ? '???' : desc) + '</div></div>' +
				(tip != '' ? ('<div class="line"></div><div style="font-size:10px;font-weight:bold;color:#999;text-align:center;padding-bottom:4px;line-height:100%;" class="crateTip">' + tip + '</div>') : '') +
				(Game.sesame ? ('<div style="font-size:9px;">Id: ' + me.id + ' | Order: ' + (me.order) + (me.tier ? ' | Tier: ' + me.tier : '') + ' | Icon: [' + me.icon[0] + ',' + me.icon[1] + ']' + '</div>') : '');
		}

		/*=====================================================================================
		Badges
		=======================================================================================*/

		// don't have a better name for these
		Game.Badges = {};
		Game.BadgesById = {};
		Game.BadgesN = 0;
		Game.BadgesOwned = 0;
		Game.Badge = function (name, desc, icon) {
			this.id = Game.BadgesN;
			this.name = name;
			this.dname = this.name;
			this.desc = desc;
			this.baseDesc = this.desc;
			this.icon = icon;
			this.got = 0;
			this.disabled = 0;
			this.order = this.id;
			if (order) this.order = order + this.id * 0.001;
			this.pool = 'normal';
			this.type = 'badge';
			this.value = 1;

			this.click = function () {
				if (this.clickFunction) this.clickFunction();
			}
			Game.last = this;
			Game.Badges[this.name] = this;
			Game.BadgesById[this.id] = this;
			Game.BadgesN++;
			return this;
		}
		Game.Badge.prototype.getType = function () { return 'Badges'; }

		Game.get = function (what) {
			if (typeof what === 'string') {
				if (Game.Badges[what]) {
					var it = Game.Badges[what];
					if (it.clickFunction) it.clickFunction();
					if (it.got == 0) {
						let name = it.shortName ? it.shortName : it.dname;
						it.got = 1;
						Game.recalculateGains = 1;

					}
				}
			}
			else { for (let i in what) { Game.get(what[i]); } }
		}

		Game.removeBadge = function (what) {
			if (Game.Badges[what]) {
				if (Game.Badges[what].got == 1) {
					Game.Badges[what].got = 0;
					Game.recalculateGains = 1;
				}
			}
		}
		Game.Badge.prototype.toggle = function () {
			if (!this.got) {
				Game.get(this.name);
			}
			else {
				Game.removeBadge(this.name);
			}
			if (Game.onMenu == 'stats') Game.UpdateMenu();
			Game.selectChallange();
		}

		Game.hasBadge = function (what) {
			return (Game.Badges[what] ? Game.Badges[what].got : 0);
		}

		for (let i in Game.Objects) {
			Game.Objects[i].debuffBadges = [];
		}

		Game.badgeBuildingDebuff = function (name, desc, building, icon, icon1) {
			let badge = new Game.Badge(name, desc, [icon, icon1]);
			if (!badge.buildingTie && building) badge.buildingTie = Game.Objects[building];
			Game.Objects[building].debuffBadges.push(badge)
			return badge;
		}

		Game.GetTieredCpsMult = (me) => {
			var mult = 1;
			for (var i in me.tieredUpgrades) { if (!Game.Tiers[me.tieredUpgrades[i].tier].special && Game.Has(me.tieredUpgrades[i].name)) mult *= 2; }
			for (var i in me.synergies) {
				var syn = me.synergies[i];
				if (Game.Has(syn.name)) {
					if (syn.buildingTie1.name == me.name) mult *= (1 + 0.05 * syn.buildingTie2.amount);
					else if (syn.buildingTie2.name == me.name) mult *= (1 + 0.001 * syn.buildingTie1.amount);
				}
			}
			if (me.fortune && Game.Has(me.fortune.name)) mult *= 1.07;
			if (me.grandma && Game.Has(me.grandma.name)) mult *= (1 + Game.Objects['Grandma'].amount * 0.01 * (1 / (me.id - 1)));
			for (let i in me.debuffBadges) {
				if (Game.hasBadge(me.debuffBadges[i].name)) mult *= 0.5;
			}
			return mult;
		}

		// define badges
		// WARNING : do NOT add new badges in between, this breaks the saves. Add them at the end !

		var order = 0; // this is used to set the order in which the items are listed

		new Game.Badge('Broken hand', 'Clicking is 10% less powerfull', [0, 0]); // implemented
		new Game.Badge('Clogged furnace', 'Cookie production multiplier <b>-10%</b>.', [0, 0]); // implemented
		new Game.Badge('Black cookie', 'Every once in awhile a black cookie spawns, if not clicked all cookies in bank are removed.', [0, 0]); //implemented
		new Game.Badge('Bad luck', 'Black cookies appear <b>twice as often</b>.', [0, 0]); // implemented
		new Game.Badge('Overcooked', 'Black cookies die <b>twice as fast</b>.', [0, 0]); // implemented
		new Game.Badge('Oops! All wrath', 'Every nat golden cookie is now wrath.', [0, 0]); Game.last.value = 7; // implemented
		new Game.Badge('Gambler\'s fever nightmare', 'Removes <b>gambler\'s fever dream</b> from grimoire.<q>No gambling addiction :(</q>', [0, 0]); Game.last.value = 5 // implemented
		new Game.Badge('Butterfingers', 'Can\'t get click frenzy and elder frenzy from Force the Hand of Fate.', [0, 0]); Game.last.value = 7; // implemented
		Game.badgeBuildingDebuff('something', 'Divides the gain from Thousand fingers by <b>2</b>.', 'Cursor', [0, 0]);
		Game.badgeBuildingDebuff('something1', 'Grandmas are <b>twice</b> as inefficient.', 'Grandma', [0, 0]);
		Game.badgeBuildingDebuff('something2', 'Time machines are <b>twice</b> as inefficient.', 'Time machine', [0, 0]);
		Game.badgeBuildingDebuff('something3', 'Antimatter condensers are <b>twice</b> as inefficient.', 'Antimatter condenser', [0, 0]);
		Game.badgeBuildingDebuff('something4', 'Prisms are <b>twice</b> as inefficient.', 'Prism', [0, 0]);
		Game.badgeBuildingDebuff('something5', 'Chancemakers are <b>twice</b> as inefficient.', 'Chancemaker', [0, 0]);
		Game.badgeBuildingDebuff('something6', 'Fractal engines are <b>twice</b> as inefficient.', 'Fractal engine', [0, 0]);
		Game.badgeBuildingDebuff('something7', 'Javascript consoles are <b>twice</b> as inefficient.', 'Javascript console', [0, 0]);
		Game.badgeBuildingDebuff('something8', 'Idleverses are <b>twice</b> as inefficient.', 'Idleverse', [0, 0]);
		Game.badgeBuildingDebuff('something9', 'Cortex bakers are <b>twice</b> as inefficient.', 'Cortex baker', [0, 0]);
		Game.badgeBuildingDebuff('something10', 'You are <b>twice</b> as inefficient.', 'You', [0, 0]);
		new Game.Badge('The voices', 'Baby shark plays for the duration of the whole run. Every once in awhile an audio clip will play, failling to complete the captcha will result in you losing an upgrade ', [0, 0]); Game.last.value = 8; // implemented
		new Game.Badge('Inflation', 'All upgrades are <b>10</b> more expensive.', [0, 0]); Game.last.value = 2; // implemented
		new Game.Badge('something 11', 'Golden cookies only appear in <b>Christmas</b>, reindeer appear in <b>every season</b> instead.', [0, 0]); Game.last.value = 4; // implemented
		new Game.Badge('The house market', 'Buildings don\'t <b>decrease</b> in value no matter what.', [0, 0]); Game.last.value = 6; // implemented
		new Game.Badge(' ', 'When selected, the game becomes invisible, except for tooltips and prompts.', [0, 0]); Game.last.clickFunction = function () { [...Game.l.children].forEach(el => el.style.opacity = Number(el.id == 'tooltipAnchor' || el.id == 'promptAnchor')); }; Game.last.value = 10; // good luck
		new Game.Badge('The house market', 'Buildings don\'t <b>decrease</b> in value no matter what.', [0, 0]); // implemented
		new Game.Badge('Loans aren\'t real', 'You can\'t get loans.<q>Loans in Cookie Clicker? What are you talking about?', [0, 0]); // implemented
		new Game.Badge('Fast clicker', 'Clicking slower than 15 clicks per second won\'t register to the big cookie.', [0, 0]); // implemented
		new Game.Badge('Squirrel', 'Godzamok is <b>25%</b> weaker.', [0, 0]); // implemented
		new Game.Badge('Fragile cookie', 'Ascend after Clicking the big cookie 1000 times.', [0, 0]); // implemented
		new Game.Badge('Dough outage', 'Can\'t unlock most cookies', [0, 0]); // implemented

		//new Game.Badge()
		LocalizeUpgradesAndAchievs();

		Game.selectChallange = function () {
			Game.tooltip.hide();
			let list = [];
			for (let i in Game.Badges) {
				let me = Game.Badges[i];
				list.push(me);
			}

			var sortMap = function (a, b) {
				if (a.order > b.order) return 1;
				else if (a.order < b.order) return -1;
				else return 0;
			}
			list.sort(sortMap);

			let badges = '';
			for (let i in list) {
				let me = list[i];
				badges += Game.crate(me, '', '', 'badge' + me.id)
			}

			//PauseGame();
			Game.Prompt('<h3>Pick an upgrade to make permanent</h3>' +
				'<div class="line"></div><div style="margin:4px auto; clear:both; width:120px;"></div>' +
				'<div class="block crateBox" style="overflow-y:scroll; float:left;clear:left;width:500px;padding:0px;height:250px;">' + badges + '</div>'
				, [["Confirm", 'Game.ClosePrompt(); '], "Cancel"], 0, 'widePrompt');
			//TickStep();
		}

		/*=====================================================================================
		Badge implemention
		=======================================================================================*/

		eval('Game.Upgrade.prototype.getPrice=' + Game.Upgrade.prototype.getPrice.toString().replace(`var price=this.basePrice;`, `var price=Game.hasBadge('Inflation') ? this.basePrice * 10 : this.basePrice;`));

		eval('Game.shimmerTypes["golden"].initFunc=' + Game.shimmerTypes["golden"].initFunc.toString().replace(`if ((!me.forceObj || !me.forceObj.noWrath) && ((me.forceObj && me.forceObj.wrath) || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3) || (Game.hasGod && Game.hasGod('scorn'))))`, `if ((!me.forceObj || !me.forceObj.noWrath) && ((me.forceObj && me.forceObj.wrath) || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3) || Game.hasBadge('Oops! All wrath') || (Game.hasGod && Game.hasGod('scorn'))))`));

		Game.mouseCps = () => {
			var add = 0;
			if (Game.Has('Thousand fingers')) add += 0.1;
			if (Game.Has('Million fingers')) add *= 5;
			if (Game.Has('Billion fingers')) add *= 10;
			if (Game.Has('Trillion fingers')) add *= 20;
			if (Game.Has('Quadrillion fingers')) add *= 20;
			if (Game.Has('Quintillion fingers')) add *= 20;
			if (Game.Has('Sextillion fingers')) add *= 20;
			if (Game.Has('Septillion fingers')) add *= 20;
			if (Game.Has('Octillion fingers')) add *= 20;
			if (Game.Has('Nonillion fingers')) add *= 20;
			if (Game.Has('Decillion fingers')) add *= 20;
			if (Game.Has('Undecillion fingers')) add *= 20;
			if (Game.Has('Unshackled cursors')) add *= 25;

			var num = 0;
			for (var i in Game.Objects) { num += Game.Objects[i].amount; }
			num -= Game.Objects['Cursor'].amount;
			add = add * num;
			if (Game.Has('Plastic mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Iron mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Titanium mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Adamantium mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Unobtainium mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Eludium mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Wishalloy mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Fantasteel mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Nevercrack mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Armythril mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Technobsidian mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Plasmarble mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Miraculite mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Aetherice mouse')) add += Game.cookiesPs * 0.01;
			if (Game.Has('Omniplast mouse')) add += Game.cookiesPs * 0.01;

			if (Game.Has('Fortune #104')) add += Game.cookiesPs * 0.01;
			var mult = 1;

			if (Game.Has('Santa\'s helpers')) mult *= 1.1;
			if (Game.Has('Cookie egg')) mult *= 1.1;
			if (Game.Has('Halo gloves')) mult *= 1.1;
			if (Game.Has('Dragon claw')) mult *= 1.03;
			if (Game.hasBadge('Broken hand')) mult *= 0.9;

			if (Game.Has('Aura gloves')) {
				mult *= 1 + 0.05 * Math.min(Game.Objects['Cursor'].level, Game.Has('Luminous gloves') ? 20 : 10);
			}

			mult *= Game.eff('click');

			if (Game.hasGod) {
				var godLvl = Game.hasGod('labor');
				if (godLvl == 1) mult *= 1.15;
				else if (godLvl == 2) mult *= 1.1;
				else if (godLvl == 3) mult *= 1.05;
			}

			for (var i in Game.buffs) {
				if (typeof Game.buffs[i].multClick != 'undefined') mult *= Game.buffs[i].multClick;
			}

			//if (Game.hasAura('Dragon Cursor')) mult*=1.05;
			mult *= 1 + Game.auraMult('Dragon Cursor') * 0.05;

			var out = mult * Game.ComputeCps(1, Game.Has('Reinforced index finger') + Game.Has('Carpal tunnel prevention cream') + Game.Has('Ambidextrous'), add);

			out = Game.runModHookOnValue('cookiesPerClick', out);

			if (Game.hasBuff('Cursed finger')) out = Game.buffs['Cursed finger'].power;
			return out;
		}

		Game.registerHook('cps', function (cps) { if (Game.hasBadge('Clogged furnace')) return cps * 0.9; else return cps; });

		Game.shimmerTypes['blackCookie'] = {
			reset: function () {
				this.last = '';
			},
			initFunc: function (me) {
				if (!this.spawned && me.force != 'cookie storm drop' && Game.chimeType != 0 && Game.ascensionMode != 1) Game.playGoldenCookieChime();

				// set image
				var bgPic = Game.resPath + 'https://bestccmodder.github.io/package-6784-mangement/img/blackCookie.png';
				var picX = 0; var picY = 0;

				me.x = Math.floor(Math.random() * Math.max(0, (Game.bounds.right - 300) - Game.bounds.left - 128) + Game.bounds.left + 64) - 64;
				me.y = Math.floor(Math.random() * Math.max(0, Game.bounds.bottom - Game.bounds.top - 128) + Game.bounds.top + 64) - 64;
				me.l.style.left = me.x + 'px';
				me.l.style.top = me.y + 'px';
				me.l.style.width = '96px';
				me.l.style.height = '96px';
				me.l.style.backgroundImage = 'url(' + bgPic + ')';
				me.l.style.backgroundPosition = (-picX * 96) + 'px ' + (-picY * 96) + 'px';
				me.l.style.opacity = '0';
				me.l.style.display = 'block';
				me.l.setAttribute('alt', "Black cookie");

				me.life = 1;// the cookie's current progression through its lifespan (in frames)
				me.dur = 10;// duration; the cookie's lifespan in seconds before it despawns

				var dur = 10;
				if (Game.hasBadge('Overcooked')) dur /= 2;
				me.dur = dur;
				me.life = Math.ceil(Game.fps * me.dur);
				me.sizeMult = 1;
			},
			updateFunc: function (me) {
				var curve = 1 - Math.pow((me.life / (Game.fps * me.dur)) * 2 - 1, 4);
				me.l.style.opacity = curve;
				if (Game.prefs.fancy) me.l.style.transform = 'rotate(' + (Math.sin(me.id * 0.69) * 24 + Math.sin(Game.T * (0.35 + Math.sin(me.id * 0.97) * 0.15) + me.id/*+Math.sin(Game.T*0.07)*2+2*/) * (3 + Math.sin(me.id * 0.36) * 2)) + 'deg) scale(' + (me.sizeMult * (1 + Math.sin(me.id * 0.53) * 0.2) * curve * (1 + (0.06 + Math.sin(me.id * 0.41) * 0.05) * (Math.sin(Game.T * (0.25 + Math.sin(me.id * 0.73) * 0.15) + me.id)))) + ')';
				me.life--;
				if (me.life <= 0) { this.missFunc(me); me.die(); }
			},
			popFunc: function (me) {
				// sparkle and kill the shimmer
				Game.SparkleAt(me.x + 48, me.y + 48);
				PlaySound('snd/shimmerClick.mp3');
				me.die();
			},
			missFunc: function (me) {
				Game.Spend(Game.cookies);
				PlaySound('snd/spellFail.mp3');
			},
			spawnsOnTimer: true,
			spawnConditions: function () {
				if (Game.hasBadge('Black cookie')) return true; else return false;
			},
			spawned: 0,
			time: 0,
			minTime: 0,
			maxTime: 0,
			getTimeMod: function (me, m) {
				if (Game.hasBadge('Bad luck')) m /= 2;
				return Math.ceil(Game.fps * 60 * m);
			},
			getMinTime: function (me) {
				var m = 5;
				return this.getTimeMod(me, m);
			},
			getMaxTime: function (me) {
				var m = 13;
				return this.getTimeMod(me, m);
			},
			last: ''
		};

		// :)
		Game.audioCaptchas = {};
		Game.audioCaptchaById = {};
		Game.audioCaptchaN = 0;
		Game.audioCaptcha = function (link, password) {
			this.id = Game.audioCaptchaN;
			this.link = link;
			this.password = password;

			Game.audioCaptchas[this.link] = this;
			Game.audioCaptchaById[this.id] = this;
			Game.audioCaptchaN++;
			return this;
		}

		// define audio captcha
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha1.mp3', 'bruh');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha2.mp3', 'are you even listening to me');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha3.mp3', 'skill issue');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha4.mp3', 'you are bad at this game');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha5.mp3', 'bad');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha6.mp3', 'book');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha7.mp3', 'very good');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha8.mp3', 'i dont know what to say right now');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha9.mp3', 'random');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha10.mp3', 'cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha11.mp3', 'go to sleep');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha12.mp3', 'voice reveal');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha13.mp3', 'imagine playing cc');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha14.mp3', 'car');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha15.mp3', 'real');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha16.mp3', 'hello');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha17.mp3', 'you missed a golden cookie');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha18.mp3', 'ground');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha19.mp3', 'fork');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha20.mp3', 'yes');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha21.mp3', 'no');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha22.mp3', 'huh');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha23.mp3', 'menu');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha24.mp3', 'start');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha25.mp3', 'end');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha26.mp3', 'finish');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha27.mp3', 'water');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha28.mp3', 'red');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha29.mp3', 'blue');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha30.mp3', 'yellow');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha31.mp3', 'are you still playing');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha32.mp3', 'budget');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha33.mp3', 'the matrix');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha34.mp3', 'example');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha35.mp3', 'bag');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha36.mp3', 'you are winner'); // never lose a race again! you are always winner
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha37.mp3', 'food');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha38.mp3', 'you should play cookieclysm');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha39.mp3', 'peanut butter cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha40.mp3', 'round british tea biscuits');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha41.mp3', 'cream cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha42.mp3', 'css sucks');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha43.mp3', 'big chips cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha44.mp3', 'gold');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha45.mp3', 'maple cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha46.mp3', 'butter cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha47.mp3', 'wrath cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha48.mp3', 'waffle cookies');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha49.mp3', 'green');
		new Game.audioCaptcha('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/audioCaptcha50.mp3', 'are you having fun');

		setInterval(function () {
			if (Game.hasBadge('The voices')) PlaySound("https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/babyShark.mp3");
			console.log("code running");
		}, 96400);

		Game.showCaptcha = function () {
			let list = [];
			for (let i in Game.audioCaptchas) {
				list.push(Game.audioCaptchas[i]);
			}
			let chooseSound = choose(list);
			PlaySound(chooseSound.link);

			let list2 = [];
			for (let i in Game.Upgrades) {
				if (Game.Upgrades[i].pool !== 'debug' || Game.Upgrades[i].pool !== 'prestige') list2.push(Game.Upgrades[i]);
			}
			let chosenUpgrade = choose(list2);
			let upgradeId = chosenUpgrade.id;

			window.PauseGame();
			Game.Prompt('<h3>Captcha</h3> <noClose> <div class="block" style="text-align:center;">What did the audio say?</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="captchaInput" value=""/></div>', [['Confirm', 'if (l(\'captchaInput\').value.trim().toLowerCase() === "' + chooseSound.password.toLowerCase() + '") {console.log("good"); Game.ClosePrompt(); window.PauseGame();} else { Game.UpgradesById[' + upgradeId + '].unearn(); Game.Notify("You failed the test!", "The answer was: ' + chooseSound.password + '", [29, 6]); Game.ClosePrompt(); window.PauseGame(); }'],]);
		}

		Game.doCaptcha = function () {
			if (Game.T % (Game.fps * 20) == 0 && Game.hasBadge('The voices') && Math.random() < 1 / 5) {
				Game.showCaptcha();
				console.log("code running");
			}
		}
		Game.registerHook('logic', Game.doCaptcha);

		Game.shimmerTypes['golden'].spawnConditions = function () {
			if (Game.hasBadge('something 11')) {
				if (!Game.Has('Golden switch [off]') && Game.season == 'christmas') {
					return true;
				} else return false;
			}
			else if (!Game.Has('Golden switch [off]')) return true; else return false;
		}
		Game.shimmerTypes['reindeer'].spawnConditions = function () {
			if (Game.hasBadge('something 11')) {
				return true;
			}
			else if (Game.season == 'christmas') return true; else return false;
		}

		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded && !Game.updateGrimoire) {
				if (Game.hasBadge('Gambler\'s fever nightmare')) { l('grimoireSpell6').style.display = "none"; }
				let fthof = Game.Objects['Wizard tower'].minigame.spells['hand of fate'];
				fthof.win = function () {
					console.log('code running')
					var newShimmer = new Game.shimmer('golden', { noWrath: true });
					var choices = [];
					choices.push('frenzy', 'multiply cookies');
					if (!Game.hasBuff('Dragonflight') && !Game.hasBadge('Butterfingers')) choices.push('click frenzy');
					if (Math.random() < 0.1) choices.push('cookie storm', 'cookie storm', 'blab');
					if (Game.BuildingsOwned >= 10 && Math.random() < 0.25) choices.push('building special');
					//if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');
					if (Math.random() < 0.15) choices = ['cookie storm drop'];
					if (Math.random() < 0.0001) choices.push('free sugar lump');
					newShimmer.force = choose(choices);
					if (newShimmer.force == 'cookie storm drop') {
						newShimmer.sizeMult = Math.random() * 0.75 + 0.25;
					}
					Game.Popup('<div style="font-size:80%;">' + loc("Promising fate!") + '</div>', Game.mouseX, Game.mouseY);
				}
				fthof.fail = function () {
					var newShimmer = new Game.shimmer('golden', { wrath: true });
					var choices = [];
					choices.push('clot', 'ruin cookies');
					if (Math.random() < 0.1) choices.push('cursed finger', ...(Game.hasBadge('Butterfingers') ? [] : 'blood frenzy'));
					if (Math.random() < 0.003) choices.push('free sugar lump');
					if (Math.random() < 0.1) choices = ['blab'];
					newShimmer.force = choose(choices);
					Game.Popup('<div style="font-size:80%;">' + loc("Backfire!") + '<br>' + loc("Sinister fate!") + '</div>', Game.mouseX, Game.mouseY);
				}
				Game.updateGrimoire = 1;
			}
		});

		Game.registerHook('check', () => {
			if (Game.Objects['Bank'].minigameLoaded && !Game.updateBank) {
				let M = Game.Objects['Bank'].minigame;

				M.draw = function () {
					//run each draw frame

					if (Game.drawT % 2 == 0 && M.toRedraw > 0 && M.graph && M.graphCtx) {
						if (M.lastTickDrawn < M.ticks - 1) M.toRedraw = 2;
						M.lastTickDrawn = M.ticks;
						M.drawGraph(M.toRedraw == 2 ? true : false);

						for (var i = 0; i < M.goodsById.length; i++) {
							var me = M.goodsById[i];
							var val = M.goodDelta(me.id);
							me.symbolNumL.innerHTML = val + '' + (val == Math.floor(val) ? '.00' : (val * 10) == Math.floor(val * 10) ? '0' : '') + '%'/*+', '+['stable','slow rise','slow fall','fast rise','fast fall','chaotic'][me.mode]*/;
							if (val >= 0) { me.symbolNumL.classList.add('bankSymbolUp'); me.symbolNumL.classList.remove('bankSymbolDown'); }
							else if (val < 0) { me.symbolNumL.classList.remove('bankSymbolUp'); me.symbolNumL.classList.add('bankSymbolDown'); }
							else { me.symbolNumL.classList.remove('bankSymbolUp'); me.symbolNumL.classList.remove('bankSymbolDown'); }

							me.valL.innerHTML = '$' + Beautify(me.val, 2);
							me.stockL.innerHTML = Beautify(me.stock);
							//if (me.stock>0) me.stockL.style.color='#fff';
							//else me.stockL.style.removeProperty('color');
							if (me.stock > 0) me.stockBoxL.classList.add('green');
							else me.stockBoxL.classList.remove('green');
							me.stockMaxL.innerHTML = '/' + Beautify(M.getGoodMaxStock(me));

							me.graphIconL.style.transform = 'translate(-8px,' + Math.floor((M.graph.height - me.vals[0] * M.graphScale)) + 'px) scale(0.5)';
						}
						M.toRedraw = 0;
					}
					if (Game.drawT % 10 == 0) {
						var office = M.offices[M.officeLevel];
						l('bankOfficeIcon').style.backgroundPosition = (-office.icon[0] * 48) + 'px ' + (-office.icon[1] * 48) + 'px';
						l('bankOfficeName').innerHTML = office.name;
						l('bankOfficeUpgrade').innerHTML = EN ? 'Upgrade (' + office.cost[0] + ' cursors)' : loc("Upgrade for %1", office.cost[0] + ' ' + Game.Objects['Cursor'].plural);
						if (!office.cost) l('bankOfficeUpgrade').style.display = 'none';
						else {
							l('bankOfficeUpgrade').style.removeProperty('display');
							if (Game.Objects['Cursor'].amount >= office.cost[0] && Game.Objects['Cursor'].level >= office.cost[1]) l('bankOfficeUpgrade').classList.remove('bankButtonOff');
							else l('bankOfficeUpgrade').classList.add('bankButtonOff');
						}
						l('bankBrokersText').innerHTML = EN ? (M.brokers == 0 ? 'no brokers' : M.brokers == 1 ? '1 broker' : (M.brokers + ' brokers')) : (loc("Brokers:") + ' ' + M.brokers);
						if (M.brokers < M.getMaxBrokers() && Game.cookies >= M.getBrokerPrice()) l('bankBrokersBuy').classList.remove('bankButtonOff');
						else l('bankBrokersBuy').classList.add('bankButtonOff');

						if (M.officeLevel <= 1 || Game.hasBadge('Loans aren\'t real')) l('bankLoan1').style.display = 'none';
						else l('bankLoan1').style.removeProperty('display');
						if (M.officeLevel <= 3 || Game.hasBadge('Loans aren\'t real')) l('bankLoan2').style.display = 'none';
						else l('bankLoan2').style.removeProperty('display');
						if (M.officeLevel <= 4 || Game.hasBadge('Loans aren\'t real')) l('bankLoan3').style.display = 'none';
						else l('bankLoan3').style.removeProperty('display');

						for (var id = 1; id < 4; id++) {
							if (Game.hasBuff('Loan ' + id) || Game.hasBuff('Loan ' + id + ' (interest)')) l('bankLoan' + id).classList.add('bankButtonOff');
							else l('bankLoan' + id).classList.remove('bankButtonOff');
						}

						var it = l('bankBalance');
						it.innerHTML = (M.profit < 0 ? '-' : '') + '$' + Beautify(Math.abs(M.profit), 2);
						if (M.profit > 0) { it.classList.add('bankSymbolUp'); it.classList.remove('bankSymbolDown'); }
						else if (M.profit < 0) { it.classList.add('bankSymbolDown'); it.classList.remove('bankSymbolUp'); }

						l('bankNextTick').innerHTML = loc("Next tick in %1.", Game.sayTime((Game.fps * M.secondsPerTick) - M.tickT + 30, -1));
					}
				}
				Game.updateBank = 0;
			}
		});

		Game.registerHook('check', () => {
			if (Game.Objects['Temple'].minigameLoaded && !Game.updateTemple) {
				let temple = Game.Objects['Temple'].minigame;
				temple.gods['ruin'].desc1 = '<span class="green">' + "Buff boosts clicks by +" + (Game.hasBadge('Squirrel') ? '0.75' : '1') + "% for every building sold for 10 seconds." + '</span>';
				temple.gods['ruin'].desc2 = '<span class="green">' + "Buff boosts clicks by +" + (Game.hasBadge('Squirrel') ? '0.38' : '0.5') + "% for every building sold for 10 seconds." + '</span>';
				temple.gods['ruin'].desc3 = '<span class="green">' + "Buff boosts clicks by +" + (Game.hasBadge('Squirrel') ? '0.18' : '0.25') + "% for every building sold for 10 seconds." + '</span>';
				for (let i in Game.Objects) {
					eval(`Game.Objects[i].sell = ` + Game.Objects[i].sell.toString().replace(`sold*0.01`, `Game.hasBadge('Squirrel') ? sold*0.0075 : sold*0.01`));
					eval(`Game.Objects[i].sell = ` + Game.Objects[i].sell.toString().replace(`sold*0.005`, `Game.hasBadge('Squirrel') ? sold*0.0038 : sold*0.005`));
					eval(`Game.Objects[i].sell = ` + Game.Objects[i].sell.toString().replace(`sold*0.0025`, `Game.hasBadge('Squirrel') ? sold*0.0018 : sold*0.0025`));

				}
				Game.updateTemple = 0;
			}
		});

		for (let i in Game.Objects) { // what a mess
			let me = Game.Objects[i];
			me.getPrice = function () {
				var price = this.basePrice * Math.pow(Game.priceIncrease, Math.max(0, Game.hasBadge('The house market') ? this.bought - this.amount : this.amount - this.free));
				price = Game.modifyBuildingPrice(this, price);
				return Math.ceil(price);
			}
			me.getSumPrice = function (amount) {
				var price = 0;
				for (var j = Math.max(0, Game.hasBadge('The house market') ? this.bought : this.amount); j < Math.max(0, (Game.hasBadge('The house market') ? this.bought : this.amount) + amount); j++) {
					price += this.basePrice * Math.pow(Game.priceIncrease, Math.max(0, j - this.free));
				}
				price = Game.modifyBuildingPrice(this, price);
				return Math.ceil(price);
			}
		}

		eval(`Game.ClickCookie=` + Game.ClickCookie.toString().replace(`Game.loseShimmeringVeil('click');`, `else if (Game.hasBadge('Fast clicker')) return; Game.loseShimmeringVeil('click');`));

		eval(`Game.NewUpgradeCookie=` + Game.NewUpgradeCookie.toString().replace(`if (!obj.locked) Game.UnlockAt.push(toPush);`,`if (!obj.locked || Game.hasBadge('Dough outage')) Game.UnlockAt.push(toPush);`));

		Game.cyocReset = function () {
			Game.updateGrimoire = 0;
			Game.updateBank = 0;
		}
		Game.registerHook('reset', Game.cyocReset);

		Game.cyocClick = function() {
			if (Game.cookieClicks >= 1000 && Game.hasBadge('Fragile cookie')) Game.Ascend(1);
		}
		Game.registerHook('click', Game.cyocClick);
	}
});
Game.selectChallange();
