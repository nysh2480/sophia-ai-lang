/*
	File: sophia_bridge.js
	Role: Sophia v1.7.2 外部境界接続 (Sapphire Nature)
*/
var SOPHIA = SOPHIA || {};

(function(app){
	"use strict";

	app.Bridge = {
		io_map: {},

		init: function() {
			// 標準の入出力ゲートを定義
			this.io_map["log"] = function(val) { app.Runtime.log(val, "type-gbl"); };
			this.io_map["warn"] = function(val) { console.warn("Sophia_Sapphire: " + val); };
			this.io_map["time"] = function() { return Date.now(); };
			
			app.Runtime.log("Sapphire Bridge Connected.", "type-system");
		},

		// $ へのデータ送出 (NaturePoolから呼ばれる)
		send: function(gate, value) {
			if (this.io_map[gate]) {
				if (typeof this.io_map[gate] === "function") {
					this.io_map[gate](value);
				} else {
					this.io_map[gate] = value;
				}
			} else {
				// 未定義ゲートへの書き込み（動的プロパティ）
				this.io_map[gate] = value;
			}
		},

		// $ からのデータ受信 (NaturePoolから呼ばれる)
		receive: function(gate) {
			if (this.io_map[gate]) {
				return (typeof this.io_map[gate] === "function") ? this.io_map[gate]() : this.io_map[gate];
			}
			return null;
		},

		// 外部状態との同期（必要に応じて拡張）
		sync: function(dt) {
			// 毎フレームのI/O更新処理
		}
	};

})(SOPHIA);