/*
	File: sophia_pool.js
	Role: Sophia v1.7.2 物理メモリプール (Nature Management)
*/
var SOPHIA = SOPHIA || {};

(function(app){
	"use strict";

	app.NaturePool = {
		// 各Nature別のデータストア
		stores: {
			CONSTANT: {}, // .
			HASH:     {}, // %
			MUTABLE:  {}, // ~
			TABLE:    {}, // # (TypedArray等)
			ARRAY:    {}, // @
			SAPPHIRE: {}  // $ (Bridge I/O)
		},
		schemas: {},

		init: function() {
			this.stores.CONSTANT = {};
			this.stores.HASH = {};
			this.stores.MUTABLE = {};
			this.stores.TABLE = {};
			this.stores.ARRAY = {};
			this.stores.SAPPHIRE = {};
			app.Runtime.log("NaturePool Initialized.", "type-system");
		},

		// # Schemaの定義 (BNF: #name [ field:type ])
		defineSchema: function(name, fields) {
			this.schemas[name] = fields;
			this.stores.TABLE[name] = [];
			app.Runtime.log("Schema defined: #" + name, "type-system");
		},

		// データの取得 (Nature記号に基づき自動分岐)
		get: function(nature, key) {
			switch(nature) {
				case ".": return this.stores.CONSTANT[key];
				case "%": return this.stores.HASH[key];
				case "~": return this.stores.MUTABLE[key];
				case "#": return this.stores.TABLE[key];
				case "@": return this.stores.ARRAY[key];
				case "$": return app.Bridge ? app.Bridge.receive(key) : null;
				default: return null;
			}
		},

		// データの書き込み
		set: function(nature, key, value) {
			switch(nature) {
				case "~":
					this.stores.MUTABLE[key] = value;
					break;
				case "%":
					this.stores.HASH[key] = value;
					break;
				case "#":
					// テーブルへの挿入または更新
					this.stores.TABLE[key] = value;
					break;
				case "@":
					if (!this.stores.ARRAY[key]) this.stores.ARRAY[key] = [];
					this.stores.ARRAY[key].push(value);
					break;
				case "$":
					if (app.Bridge) app.Bridge.send(key, value);
					break;
				case ".":
					console.warn("Sophia_Pool: Cannot rewrite Constant Nature '.'");
					break;
			}
		},

		// 物理削除 (BNF: [ x ])
		remove: function(nature, key) {
			if (this.stores.hasOwnProperty(nature)) {
				delete this.stores[nature][key];
			}
		}
	};

})(SOPHIA);