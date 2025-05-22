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
	}
}

Game.debugCYOC = 1;

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

		var img = "https://bestccmodder.github.io/package-6784-mangement/img/cyocIcons.png";
		//var img = "img/cyocIcons.png";

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

		Game.originalAura = Game.dragonAuras['1'];

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
				(Game.sesame ? ('<div style="font-size:9px;">Id: ' + me.id + ' | Order: ' + (me.order) + (me.tier ? ' | Tier: ' + me.tier : '') + ' | Icon: [' + me.icon[0] + ',' + me.icon[1] + ']' + '</div>') : (me.type == 'badge' ? '<div style="font-size:10px;">Value: ' + me.value + '</div>' : ''));
		}

		/*=====================================================================================
		Badges
		=======================================================================================*/

		// don't have a better name for these
		Game.Badges = {};
		Game.BadgesById = [];
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
			//this.disableFunction = disableFunction;

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
				if (this.disableFunction) this.disableFunction();
				//if (!Game.hasBadge(' ')) { [...Game.l.children].forEach(el => el.style.removeProperty('opacity')); }
			}
			if (Game.onMenu == 'stats') Game.UpdateMenu();
			Game.selectChallange();
		}

		/*Game.GetIcon=function(type,tier)
		{
			var col=0;
			if (type=='Kitten') col=18; else col=Game.Objects[type].iconColumn;
			return [col,Game.Tiers[tier].iconRow];
		}*/

		Game.hasBadge = function (what) {
			return (Game.Badges[what] ? Game.Badges[what].got : 0);
		}

		for (let i in Game.Objects) {
			Game.Objects[i].debuffBadges = [];
		}

		Game.getBuildingDebuffIcon = function (icon) {
			return [icon, 3, img];
		}

		Game.badgeBuildingDebuff = function (name, desc, building, icon, icon1) {
			let badge = new Game.Badge(name, desc, Game.getBuildingDebuffIcon(icon));
			if (!badge.buildingTie && building) badge.buildingTie = Game.Objects[building];
			Game.Objects[building].debuffBadges.push(badge);
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

		Game.badgeValue = function () {
			let value = 0
			for (let i in Game.Badges) {
				if (Game.Badges[i].got) value += Game.Badges[i].value;
			}
			return value;
		}
		eval('Game.computeLumpTimes=' + Game.computeLumpTimes.toString().replace(`Game.lumpOverripeAge/=2000;}`, `Game.lumpOverripeAge/=2000;} Game.lumpRipeAge-=6000 * Game.badgeValue();`));

		// define badges
		// WARNING : do NOT add new badges in between, this breaks the saves. Add them at the end !

		var order = 0; // this is used to set the order in which the items are listed

		new Game.Badge('Broken hand', 'Clicking is 10% less powerful.', [0, 0]); // implemented
		new Game.Badge('Clogged furnace', 'Cookie production multiplier <b>-10%</b>.', [0, 0]); // implemented
		new Game.Badge('Black cookie', 'Every once in awhile a black cookie spawns, if not clicked all cookies in bank are removed.', [0, 0]); //implemented
		new Game.Badge('Bad luck', 'Black cookies appear <b>twice as often</b>.', [0, 0]); // implemented
		new Game.Badge('Overcooked', 'Black cookies die <b>twice as fast</b>.', [0, 0]); // implemented
		new Game.Badge('Oops! All wrath', 'Every nat golden cookie is now wrath.', [0, 0]); Game.last.value = 7; // implemented
		new Game.Badge('Gambler\'s fever nightmare', 'Removes <b>gambler\'s fever dream</b> from grimoire.<q>No gambling addiction :(</q>', [0, 0]); Game.last.value = 5 // implemented
		new Game.Badge('Butterfingers', 'Can\'t get click frenzy and elder frenzy from Force the Hand of Fate.', [0, 0]); Game.last.value = 7; // implemented
		Game.badgeBuildingDebuff('something', 'Divides the gain from Thousand fingers by <b>2</b>.', 'Cursor', 0);
		Game.badgeBuildingDebuff('something1', 'Grandmas are <b>twice</b> as inefficient.', 'Grandma', 1);
		Game.badgeBuildingDebuff('something2', 'Time machines are <b>twice</b> as inefficient.', 'Time machine', 8);
		Game.badgeBuildingDebuff('something3', 'Antimatter condensers are <b>twice</b> as inefficient.', 'Antimatter condenser', 13);
		Game.badgeBuildingDebuff('something4', 'Prisms are <b>twice</b> as inefficient.', 'Prism', 14);
		Game.badgeBuildingDebuff('something5', 'Chancemakers are <b>twice</b> as inefficient.', 'Chancemaker', 19);
		Game.badgeBuildingDebuff('something6', 'Fractal engines are <b>twice</b> as inefficient.', 'Fractal engine', 20);
		Game.badgeBuildingDebuff('something7', 'Javascript consoles are <b>twice</b> as inefficient.', 'Javascript console', 21);
		Game.badgeBuildingDebuff('something8', 'Idleverses are <b>twice</b> as inefficient.', 'Idleverse', 22);
		Game.badgeBuildingDebuff('something9', 'Cortex bakers are <b>twice</b> as inefficient.', 'Cortex baker', 23);
		Game.badgeBuildingDebuff('something10', 'You are <b>twice</b> as inefficient.', 'You', 24);
		new Game.Badge('Lactos intolerance', 'All kitten upgrades are locked.', [18, 3, img]); Game.last.clickFunction = function () { delete Game.dragonAuras['1']; }; Game.last.disableFunction = function () { Game.dragonAuras['1'] = Game.originalAura; };
		new Game.Badge('The voices', 'Baby shark plays for the duration of the whole run. Every once in awhile an audio clip will play, failling to complete the captcha will result in you losing an upgrade ', [0, 0]); Game.last.value = 8; // implemented
		new Game.Badge('Inflation', 'All upgrades are <b>10</b> more expensive.', [0, 0]); Game.last.value = 2; // implemented
		new Game.Badge('something 11', 'Golden cookies only appear in <b>Christmas</b>, reindeer appear in <b>every season</b> instead.', [0, 0]); Game.last.value = 4; // implemented
		new Game.Badge('The house market', 'Buildings don\'t <b>decrease</b> in value no matter what.', [0, 0]); Game.last.value = 6; // implemented
		new Game.Badge(' ', 'When selected, the game becomes invisible, except for tooltips and prompts.', [0, 0]); Game.last.clickFunction = function () { [...Game.l.children].forEach(el => el.style.opacity = Number(el.id == 'tooltipAnchor' || el.id == 'promptAnchor')); }; Game.last.disableFunction = function () { [...Game.l.children].forEach(el => el.style.removeProperty('opacity')); }; Game.last.value = 10; // good luck
		new Game.Badge('Loans aren\'t real', 'You can\'t get loans.<q>Loans in Cookie Clicker? What are you talking about?', [0, 0]); // implemented
		new Game.Badge('Fast clicker', 'Clicking slower than 15 clicks per second won\'t register to the big cookie.', [0, 0]); // implemented
		new Game.Badge('Squirrel', 'Godzamok is <b>25%</b> weaker.', [0, 0]); // implemented
		new Game.Badge('Fragile cookie', 'Ascend after Clicking the big cookie 1000 times.', [0, 0]); // implemented
		new Game.Badge('Dough outage', 'Can\'t unlock most cookies', [0, 0]); // implemented
		new Game.Badge('Game show', 'Upon reincarnation a Game show will start, failing to pass will lose you a heavenly upgrade.', [0, 0]); // implemented
		new Game.Badge('Liquid nitrogen', 'Freezing the garden can randomly kill a plant.', [24, 2, img]);
		new Game.Badge('Building bundle', 'There is a 1% chance when buying a building to buy 200 of every building instead.', [0, 0, img]);

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
			Game.Prompt('<h3>Pick a debuff</h3>' +
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

		eval('Game.Logic=' + Game.Logic.toString().replace(`if (Game.milkProgress>=0.5) Game.Unlock('Kitten helpers');
			if (Game.milkProgress>=1) Game.Unlock('Kitten workers');
			if (Game.milkProgress>=2) Game.Unlock('Kitten engineers');
			if (Game.milkProgress>=3) Game.Unlock('Kitten overseers');
			if (Game.milkProgress>=4) Game.Unlock('Kitten managers');
			if (Game.milkProgress>=5) Game.Unlock('Kitten accountants');
			if (Game.milkProgress>=6) Game.Unlock('Kitten specialists');
			if (Game.milkProgress>=7) Game.Unlock('Kitten experts');
			if (Game.milkProgress>=8) Game.Unlock('Kitten consultants');
			if (Game.milkProgress>=9) Game.Unlock('Kitten assistants to the regional manager');
			if (Game.milkProgress>=10) Game.Unlock('Kitten marketeers');
			if (Game.milkProgress>=11) Game.Unlock('Kitten analysts');
			if (Game.milkProgress>=12) Game.Unlock('Kitten executives');
			if (Game.milkProgress>=13) Game.Unlock('Kitten admins');
			if (Game.milkProgress>=14) Game.Unlock('Kitten strategists');`, `if (!Game.hasBadge('Lactos intolerance')) { if (Game.milkProgress>=0.5) Game.Unlock('Kitten helpers');
			if (Game.milkProgress>=1) Game.Unlock('Kitten workers');
			if (Game.milkProgress>=2) Game.Unlock('Kitten engineers');
			if (Game.milkProgress>=3) Game.Unlock('Kitten overseers');
			if (Game.milkProgress>=4) Game.Unlock('Kitten managers');
			if (Game.milkProgress>=5) Game.Unlock('Kitten accountants');
			if (Game.milkProgress>=6) Game.Unlock('Kitten specialists');
			if (Game.milkProgress>=7) Game.Unlock('Kitten experts');
			if (Game.milkProgress>=8) Game.Unlock('Kitten consultants');
			if (Game.milkProgress>=9) Game.Unlock('Kitten assistants to the regional manager');
			if (Game.milkProgress>=10) Game.Unlock('Kitten marketeers');
			if (Game.milkProgress>=11) Game.Unlock('Kitten analysts');
			if (Game.milkProgress>=12) Game.Unlock('Kitten executives');
			if (Game.milkProgress>=13) Game.Unlock('Kitten admins');
			if (Game.milkProgress>=14) Game.Unlock('Kitten strategists'); }`)); // if it works it works

		Game.Upgrades['Kitten angels'].showIf = function () { return (!Game.hasBadge('Lactos intolerance')) };
		Game.Upgrades['Kitten wages'].showIf = function () { return (!Game.hasBadge('Lactos intolerance')) };

		eval('Game.getNewTicker=' + Game.getNewTicker.toString().replace(`Game.HasAchiev('O Fortuna')?0.04:0.02`, `Game.HasAchiev('O Fortuna')?4.04:4.02`));

		eval('Game.getNewTicker=' + Game.getNewTicker.toString().replace(`var fortunes=[];
				for (var i in Game.Tiers['fortune'].upgrades)
				{
					var it=Game.Tiers['fortune'].upgrades[i];
					if (!Game.HasUnlocked(it.name)) fortunes.push(it);
				}`, `var fortunes=[];
				for (var i in Game.Tiers['fortune'].upgrades)
				{
					var it=Game.Tiers['fortune'].upgrades[i];
					if (!Game.HasUnlocked(it.name) && (!Game.hasBadge('Lactos intolerance') || it.name !== 'Fortune #103')) fortunes.push(it);
				}`));


		eval('Game.UpgradeDragon=' + Game.UpgradeDragon.toString().replace(`PlaySound('snd/shimmerClick.mp3');`, `PlaySound('snd/shimmerClick.mp3'); if (Game.hasBadge('Lactos intolerance') && Game.dragonLevel == 4) { return;  }`));



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
			if (Game.hasBadge('The voices') && !Game.quizState) PlaySound("https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/babyShark.mp3");
			console.log("code running");
		}, 96400);

		Game.stopPain = function (url) {
			for (let i = 0; i < SoundInsts.length; i++) {
				if (SoundInsts[i] && !SoundInsts[i].paused && SoundInsts[i].src == url) {
					SoundInsts[i].pause();
					SoundInsts[i].currentTime = 0;
					break;
				}
			}
		}

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
			if (Game.T % (Game.fps * 20) == 0 && Game.hasBadge('The voices') && !Game.quizState && Math.random() < 1 / 5) {
				Game.showCaptcha();
				console.log("code running");
			}
		}
		Game.registerHook('logic', Game.doCaptcha);

		Game.quizState = 0;
		Game.correctAnswer = 0;
		Game.quizzes = {};
		Game.quizById = [];
		Game.quizN = 0;
		Game.quiz = function (question, answer) {
			this.id = Game.quizN;
			this.question = question;
			this.answer = answer;

			Game.quizzes[this.question] = this;
			Game.quizById[this.id] = this;
			Game.quizN++;
			return this;
		}

		// define the quizzes
		new Game.quiz('What is the name of the upgrade that unlocks 100% of the potential of your prestige level?', 'heavenly key');
		new Game.quiz('At how many achievements do you unlock chocolate milk?', '25');
		new Game.quiz(`How many wrinklers can eat the big cookie at once? <br>1. 10 <br>2. 12 <br>3. 14`, '3');
		new Game.quiz('How many sugar lumps are required to 100% the game?', '1123');
		new Game.quiz('Is You the last building in the game (yes/no)?', 'yes');
		new Game.quiz(`Where can you see the forgotten madeleine? <br>1. Bottom left of the stats tab <br>2. Bottom right of the option tab <br>3. Bottom right of the info tab`, '3');
		new Game.quiz('How many lump types are there?', '5');
		new Game.quiz('Am I the best CC modder?', 'no');
		new Game.quiz('How many plantable, non-immortal seeds are there?', '31');
		new Game.quiz('How long is the ascend animation <br>1. 5s <br>2. 4s <br>3. 3s ', '1');
		new Game.quiz('What is Spontaneous Edifice building giving limit?', '400');
		new Game.quiz('What\'s 9+10', '21');
		new Game.quiz('Who made this mod? <br>1. CursedSliver <br>2. Helloperson <br>3. Yeetdragon <br>4. Omar uvu', '4');
		new Game.quiz('How many permanent upgrade slots are there?', '5');
		new Game.quiz('What\'s the max number that can appear in the 1 hour of CpS fortune?', '99');
		new Game.quiz('What\'s the id of the last spell added to grimoire?', '18');
		new Game.quiz('I will ask a really easy question. Is CSS good?', 'no');
		new Game.quiz('What is the name of the highest level rank in dashnet\'s discord server', 'ruby chocolate dragon');
		new Game.quiz('which of these versions added ascension: <br>1.  v. 1.05 <br>2. v.1.0501 <br>3. v. 1.9', '1');
		new Game.quiz('Who is the best Cookie Clicker player?', '3+4i');
		new Game.quiz('How many golden cookie clicks do you need for seven horseshoes achievement?', '27777');
		new Game.quiz('What is the value of Game.fps', '30');
		new Game.quiz('How many seasons are there?', '5');
		new Game.quiz('Which season increases golden cookie spawn rate the most? <br>1. Halloween <br>2. Business day <br>3. Easter', '2');
		new Game.quiz('What version added krumblor?', 'v. 1.9');
		new Game.quiz('How many Buildings did v. 1.032 have?', '9');
		new Game.quiz('Imagine you were Omar, modding CC. VS code crashed, you lost all your prgress. What do you do? <br>1. Rage quit and cancel the mod <br>2. Work from the last saved version (it was two weeks ago) <br>3. Try to somehow recover the file <br>4. Pull from the github repo (this one is also two weeks ago, but 4 hours later)', '1');
		new Game.quiz('How many pledges are required to unlock sacrificial rolling pins?', '10');
		new Game.quiz('What\'s the max value of heralds', '100');
		new Game.quiz('Which of the following golden cookie effects can you not spawn from the debug menu? <br>1. Sweet <br>2. Everything must go <br>3. Cursed finger', '2');
		new Game.quiz('How many loans are there <br>1. 3 <br>2. 0 <br>3. 2', '2');
		new Game.quiz('What\'s the value of meaty lumps in code?', '3');
		new Game.quiz('I have 9 CpS. What is the min number of buildings I could have?', '0');
		new Game.quiz('What\'s the chance of fortune appearing in news, with O Fortuna achievement?', '4%');
		new Game.quiz('What is Omar\'s favorite version?', 'v 1.9');
		new Game.quiz('Jimmy has all heavenly upgrades and decides to go through his upgrades list to count the number of tiered building upgrades that display the unshackled subtext below the upgrade name and above the upgrade description. Assuming Jimmy also has all the upgrades, what is the number that he counts', '284');
		new Game.quiz('What is the default volume precent of the game?', '75%');
		new Game.quiz('What does CYOC stand for?', 'choose your own challenge');
		new Game.quiz('1+1=?', '2');
		new Game.quiz('When was CC released (year)?', '2013');
		new Game.quiz('Do you like this mod? Hint: there is one correct answer (yes/no).', 'yes');
		new Game.quiz('How many garden plants have names which are 2 words?', '9');
		new Game.quiz('It is Wednesday, December 31, 1969 at 16:16:40.000 in GMT-8 (Pacific Standard Time). Or at least according to Jimmy\'s computer. Jimmy harvests a ripe lump, 0 milliseconds passing during this action. He has Dragon\'s Curve and Radiant Appetite slotted, and is in Easter season. Jimmy has also just finished WWWWW, and has 999,999 spells cast. He decides to cast gambler\'s fever dream again, because why not. It turns out, gambler\'s fever dream casts Force the Hand of Fate, which spawns a wrath cookie on the left edge of the building buying section. Which of the following outcomes does Jimmy hope to receive from clicking the wrath cookie, so that his current lump type could be a golden lump? <br>1. Ruin <br>2. Free sugar lump <br>3. Blab <br>4. Elder frenzy ', '3');
		new Game.quiz('How long is the soil swapping cooldown> <br>1. 5 min <br>2. 10 min <br>3. 15 min', '2');
		new Game.quiz('Jimmy\'s morally grey twin sister Mimmy decides to perform a prank on her brother. She replaces the chocolate egg source code with chocolate \"egg\", which grants 0.9% of bank. What is the reduction in earning from Jimmy\'s next combo in percent? Round your answer to 1 decimal. <br>1. 3.9% <br>2. 4.1% <br>3. 9.8% ', '1');
		new Game.quiz('How many upgrades have the Self-referential tier?', '2');
		new Game.quiz('How many garden drop <b>cookies</b> are there?', '5');
		new Game.quiz('Dragonflight overrides an existing click frenzy how much of the time?', '80%');
		new Game.quiz('What\'s the chance of "building special" getting pushed to Force the Hands of Fate pool?', '25%');
		new Game.quiz('This is a free one, don\'t type anything.', '');

		Game.startQuiz = function (quiz) {
			Game.quizState = 1;

			if (Game.hasBadge('The voices')) Game.stopPain('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/babyShark.mp3');

			if (quiz == 1) {
				PlaySound('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/swanky.mp3');

				Game.loopMusic = setInterval(function () {
					PlaySound('https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/swanky.mp3');
				}, 47175);
			}

			let list = [];
			for (let i in Game.quizzes) {
				list.push(Game.quizzes[i]);
			}
			let chooseQuestion = choose(list);

			let list2 = [];
			for (let i in Game.Upgrades) {
				if (Game.Upgrades[i].pool == 'prestige' && Game.Has(Game.Upgrades[i].name)) list2.push(Game.Upgrades[i]);
			}
			let chosenUpgrade = choose(list2);
			let upgradeId = chosenUpgrade.id;

			if (quiz == 1) {
				Game.Prompt('<h3>Game show!</h3> <noClose> <div class="block" style="text-align:left;">' + chooseQuestion.question + '</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="answerInput" value=""/></div>', [['Confirm', 'if (l(\'answerInput\').value.trim().toLowerCase() === "' + chooseQuestion.answer.toLowerCase() + '") { Game.correctAnswer++; PlaySound(\'snd/spell.mp3\'); } else { PlaySound(\'snd/spellFail.mp3\'); } Game.startQuiz(2);'],]);
			}
			if (quiz == 2) {
				Game.Prompt('<h3>Game show!</h3> <noClose> <div class="block" style="text-align:left;">' + chooseQuestion.question + '</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="answerInput" value=""/></div>', [['Confirm', 'if (l(\'answerInput\').value.trim().toLowerCase() === "' + chooseQuestion.answer.toLowerCase() + '") { Game.correctAnswer++; PlaySound(\'snd/spell.mp3\'); } else { PlaySound(\'snd/spellFail.mp3\'); } Game.startQuiz(3);'],]);
			}
			if (quiz == 3) {
				Game.Prompt('<h3>Game show!</h3> <noClose> <div class="block" style="text-align:left;">' + chooseQuestion.question + '</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="answerInput" value=""/></div>', [['Confirm', 'if (l(\'answerInput\').value.trim().toLowerCase() === "' + chooseQuestion.answer.toLowerCase() + '") { Game.correctAnswer++; PlaySound(\'snd/spell.mp3\'); } else { PlaySound(\'snd/spellFail.mp3\'); } if (Game.correctAnswer < 2) {Game.UpgradesById[' + upgradeId + '].unearn();} Game.ClosePrompt(); Game.quizState = 0; clearInterval(Game.loopMusic); Game.stopPain(\'https://bestccmodder.github.io/package-6784-mangement/audioCaptcha/swanky.mp3\'); Game.correctAnswer = 0;'],]);
			}
		}

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

				eval('M.draw=' + M.draw.toString().replace(`if (M.officeLevel<=1) l('bankLoan1').style.display='none';`, `if (M.officeLevel <= 1 || Game.hasBadge('Loans aren\\'t real')) { l('bankLoan1').style.display = 'none'; }`));
				eval('M.draw=' + M.draw.toString().replace(`if (M.officeLevel<=3) l('bankLoan2').style.display='none';`, `if (M.officeLevel <= 3 || Game.hasBadge('Loans aren\\'t real')) { l('bankLoan2').style.display = 'none'; }`));
				eval('M.draw=' + M.draw.toString().replace(`if (M.officeLevel<=4) l('bankLoan3').style.display='none';`, `if (M.officeLevel <= 4 || Game.hasBadge('Loans aren\\'t real')) { l('bankLoan3').style.display = 'none'; }`));

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

		Game.registerHook('check', () => {
			if (Game.Objects['Farm'].minigameLoaded && !Game.updateGarden) {
				let M = Game.Objects['Farm'].minigame
				M.soilsById.soilsById = [];
				var n = 0;
				for (var i in M.soils) {
					M.soils[i].id = n;
					M.soils[i].key = i;
					M.soilsById[n] = M.soils[i];
					n++;
				}

				M.harvestAll = function (type, mature, mortal) // declaring harvestAll so M.convert works
				{
					var harvested = 0;
					for (var i = 0; i < 2; i++) // we do it twice to take care of whatever spawns on kill
					{
						for (var y = 0; y < 6; y++) {
							for (var x = 0; x < 6; x++) {
								if (M.plot[y][x][0] >= 1) {
									var doIt = true;
									var tile = M.plot[y][x];
									var me = M.plantsById[tile[0] - 1];
									if (type && me != type) doIt = false;
									if (mortal && me.immortal) doIt = false;
									if (mature && tile[1] < me.mature) doIt = false;

									if (doIt) harvested += M.harvest(x, y) ? 1 : 0;
								}
							}
						}
					}
					if (harvested > 0) setTimeout(function () { PlaySound('snd/harvest1.mp3', 1, 0.2); }, 50);
					if (harvested > 2) setTimeout(function () { PlaySound('snd/harvest2.mp3', 1, 0.2); }, 150);
					if (harvested > 6) setTimeout(function () { PlaySound('snd/harvest3.mp3', 1, 0.2); }, 250);
				}

				// i love garden code
				Game.killPlant = function () {
					let plant = [];
					for (let y = 0; y < 6; y++) {
						for (let x = 0; x < 6; x++) {
							if (M.plot[y][x][0] >= 1) {
								plant.push({ x, y });
								//console.log({ x, y });
							}
						}
					}
					let { x, y } = choose(plant);
					M.harvest(x, y);
				}

				M.tools['freeze'].func = function () {
					PlaySound('snd/toneTick.mp3');
					M.freeze = (M.freeze ? 0 : 1);
					if (M.freeze) {
						M.computeEffs();
						PlaySound('snd/freezeGarden.mp3');
						this.classList.add('on');
						l('gardenContent').classList.add('gardenFrozen');

						for (let y = 0; y < 6; y++) {
							for (let x = 0; x < 6; x++) {
								let tile = M.plot[y][x];
								if (tile[0] > 0) {
									let me = M.plantsById[tile[0] - 1];
									let age = tile[1];
									if (me.key == 'cheapcap' && Math.random() < 0.15) {
										M.plot[y][x] = [0, 0];
										if (me.onKill) me.onKill(x, y, age);
										M.toRebuild = true;
									}
								}
							}
						}
						if (Game.hasBadge('Liquid nitrogen') && Math.random() < 1 / 5) Game.killPlant(); // ik ik. someday i will have a better way of injecting objects
					}
					else {
						M.computeEffs();
						this.classList.remove('on');
						l('gardenContent').classList.remove('gardenFrozen');
					}
				}
				M.buildPanel();
				Game.updateGarden = 0;
			}
		});

		for (let i in Game.Objects) { // what a mess
			let me = Game.Objects[i];
			me.getPrice = function () {
				var price = this.basePrice * Math.pow(Game.priceIncrease, Math.max(0, Game.hasBadge('The house market') ? this.bought - this.free : this.amount - this.free));
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

			me.buy = function (amount, bypass) {
				if (Game.buyMode == -1) { this.sell(Game.buyBulk, 1); return 0; }
				var success = 0;
				var moni = 0;
				var bought = 0;
				if (!amount) amount = Game.buyBulk;
				if (amount == -1) amount = 1000;
				for (var k = 0; k < amount; k++) {
					var price = this.getPrice();
					if (Game.cookies >= price) {
						bought++;
						moni += price;
						Game.Spend(price);
						this.amount++;
						this.bought++;
						price = this.getPrice();
						this.price = price;
						if (this.buyFunction) this.buyFunction();
						Game.recalculateGains = 1;
						if (this.amount == 1 && this.id != 0) l('row' + this.id).classList.add('enabled');
						this.highest = Math.max(this.highest, this.amount);
						Game.BuildingsOwned++;
						success = 1;
						if (!bypass) {
							if (Math.random() < 1 / 100 && Game.hasBadge('Building bundle')) for (let k in Game.Objects) { Game.Objects[k].buy(200, true); }
						}
					}
				}
				if (success) { PlaySound('snd/buy' + choose([1, 2, 3, 4]) + '.mp3', 0.75); this.refresh(); }
			}
		}

		eval(`Game.ClickCookie=` + Game.ClickCookie.toString().replace(`Game.loseShimmeringVeil('click');`, `else if (Game.hasBadge('Fast clicker')) return; Game.loseShimmeringVeil('click');`));

		eval(`Game.NewUpgradeCookie=` + Game.NewUpgradeCookie.toString().replace(`if (!obj.locked) Game.UnlockAt.push(toPush);`, `if (!obj.locked || Game.hasBadge('Dough outage')) Game.UnlockAt.push(toPush);`));

		Game.cyocReset = function () {
			Game.updateGrimoire = 0;
			Game.updateBank = 0;
		}
		Game.registerHook('reset', Game.cyocReset);

		Game.cyocReincarnate = function () {
			if (Game.hasBadge('Game show')) Game.startQuiz(1);
		}
		Game.registerHook('reincarnate', Game.cyocReincarnate);

		Game.cyocClick = function () {
			if (Game.cookieClicks >= 1000 && Game.hasBadge('Fragile cookie')) Game.Ascend(1);
		}
		Game.registerHook('click', Game.cyocClick);

		window.addEventListener('keydown', function (e) {
			if (e.keyCode == 85 && Game.debugCYOC) Game.selectChallange();
		})
	},
	save: function () {
		let str = "";
		for (let i of Game.BadgesById) { str += i.got; }
		str += '|';
		str += Game.quizState;
		return str;
	},
	load: function (str) {
		console.log(str);
		for (let i in Game.BadgesById) {
			Game.BadgesById[i].got = Number(str[i]);
			if (Game.BadgesById[i].clickFunction && Game.BadgesById[i].got > 0) Game.BadgesById[i].clickFunction();
		}
		str = str.split('|');
		strIn = str[1];
		Game.quizState = parseFloat(str[1]);
		if (strIn[0]) { Game.quizState = parseFloat(strIn[0]); }
		if (Game.quizState) Game.startQuiz(1);
	}
});
//Game.selectChallange();
//eval('Game.Logic=' + Game.Logic.toString().replace(`if (Game.T%(Game.fps*5)==0 && !Game.mouseDown && (Game.onMenu=='stats' || Game.onMenu=='prefs')) Game.UpdateMenu();`, `//if (Game.T%(Game.fps*5)==0 && !Game.mouseDown && (Game.onMenu=='stats' || Game.onMenu=='prefs')) Game.UpdateMenu();`));