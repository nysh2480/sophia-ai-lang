/*
	File: sophia_core.js
	Role: Sophia (AI₂O₃) v1.7.2 基盤定義
*/
var SOPHIA = SOPHIA || {};

(function(app){
	"use strict";

	app.CONFIG = {
		VERSION: "1.7.2",
		NATURES: {
			CONSTANT: ".",
			HASH: "%",
			MUTABLE: "~",
			TABLE: "#",
			ARRAY: "@",
			SAPPHIRE: "$"
		}
	};

	app.Runtime = {
		isInitialized: false,
		currentFrame: 0,
		elapsedTime: 0,
		
		init: function() {
			this.isInitialized = true;
			this.currentFrame = 0;
			this.elapsedTime = 0;
			if (app.Runtime.log) {
				app.Runtime.log("Sophia Runtime v" + app.CONFIG.VERSION + " Initialized.", "type-system");
			}
		},

		log: function(msg, type) {
			console.log("[" + (type || "LOG") + "] " + msg);
		}
	};

})(SOPHIA);