/*
	File: sophia_bootstrap.js
	Role: Sophia v1.7.2 起動・デバッグ
*/
var SOPHIA = window.SOPHIA || {};

(function(app){
	"use strict";

	app.Main = {
		scenes: {},
		
		init: function() {
			app.Runtime.init();
			app.Runtime.log("Sophia Engine v1.7.2 Fully Integrated.", "type-system");
		},

		register_scene: function(name, fn) {
			this.scenes[name] = fn;
		},

		loadScript: function(source) {
			try {
				app.Runtime.log("Starting Compilation...", "transpiler");
				
				// 1. トランスパイル実行
				var jsCode = app.Transpiler.compile(source);
				
				// 2. 【デバッグ出力】実行直前のJSをコンソールに詳細表示
				console.log("=== DEBUG: Executing Generated JS ===");
				console.log(jsCode);
				console.log("=====================================");

				// 3. JavaScriptとして評価
				var runner = new Function("app", jsCode);
				runner(app);
				
				app.Runtime.log("Script loaded and executed successfully.", "type-system");
				
				// 初回シーン実行
				if (app.PulseFlow) {
					app.PulseFlow.switchScene("Main");
				}
			} catch (e) {
				// エラー時にどのコードで失敗したかを表示
				console.error("Sophia Execution Error!");
				console.error("Message:", e.message);
				if (typeof jsCode !== 'undefined') {
					console.error("Failed at code:\n", jsCode);
				}
				throw e;
			}
		}
	};

})(window.SOPHIA);