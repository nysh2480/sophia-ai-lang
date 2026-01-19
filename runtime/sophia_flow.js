/*
	File: sophia_flow.js
	Role: Sophia v1.7.2 実行フロー制御
*/
var SOPHIA = SOPHIA || {};

(function(app){
	"use strict";

	app.PulseFlow = {
		activeScene: null,
		currentLens: "|>",
		tasks: [],
		
		switchScene: function(sceneName) {
			if (app.Main && app.Main.scenes[sceneName]) {
				this.activeScene = sceneName;
				app.Runtime.log("Flow: Scene switched to " + sceneName, "type-system");
			} else {
				app.Runtime.log("Flow: Scene '" + sceneName + "' not found.", "type-error");
			}
		},

		update: function() {
			if (this.activeScene && app.Main && app.Main.scenes[this.activeScene]) {
				var context = {
					frame: app.Runtime.currentFrame,
					time: app.Runtime.elapsedTime,
					lens: this.currentLens
				};
				try {
					app.Main.scenes[this.activeScene](context);
				} catch (e) {
					console.error("Sophia Scene Error:", e);
				}
			}

			var i = 0;
			while (i < this.tasks.length) {
				var task = this.tasks[i];
				if (task && task.active) {
					task.fn();
					i++;
				} else {
					this.tasks.splice(i, 1);
				}
			}
		},

		addTask: function(name, fn) {
			this.tasks.push({ name: name, fn: fn, active: true });
		}
	};

})(SOPHIA);