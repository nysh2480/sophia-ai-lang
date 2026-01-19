/*
	File: sophia_bootstrap.js
	Role: Sophia v1.7.2 統合起動エンジン
*/
var SOPHIA = SOPHIA || {};

(function(app){
	"use strict";

	app.Main = {
		lastTime: 0,
		isPaused: false,
		scenes: {},
		tasks: {},

		init: function() {
			// 1. メモリプールの初期化
			if (app.NaturePool) app.NaturePool.init();
			
			// 2. 外部ブリッジの接続
			if (app.Bridge) app.Bridge.init();
			
			// 3. ランタイム情報の初期化
			if (app.Runtime) app.Runtime.init();

			this.lastTime = Date.now();
			app.Runtime.log("Sophia Engine v" + app.CONFIG.VERSION + " Fully Integrated.", "type-system");
		},

		loadScript : function(sophiaSource) {
			try {
				app.Runtime.log("Compiling Sophia Source...", "type-gbl");
			
				// トランスパイラを呼び出してJS化
				var jsCode = app.Transpiler.compile(sophiaSource);
				console.log("--- Generated JS (Sophia) ---\n" + jsCode);

				// 実行環境（app）を渡して実行可能な関数を生成
				var executable = new Function("app", jsCode);
			
				// Sophiaスクリプト内の定義（シーンやタスクの登録）を実行
				executable(app);

				// 【修正】実行後、Mainシーンが登録されていれば自動でフローを開始する
				if (app.PulseFlow && this.scenes["Main"]) {
					app.PulseFlow.switchScene("Main");
					app.Runtime.log("Main scene detected and started.", "type-system");
				}

				app.Runtime.log("Sophia Script Loaded and Executed.", "type-gbl");
				return true;
			} catch (e) {
				app.Runtime.log("Sophia Runtime Error: " + e.message, "type-error");
				console.error(e);
				return false;
			}
		},

		register_scene: function(name, fn) { 
			this.scenes[name] = fn; 
		},

		register_task: function(name, fn) { 
			this.tasks[name] = fn; 
		},

		start: function() {
			var self = this;
			this.lastTime = Date.now();
			
			var loop = function() {
				if (!self.isPaused) {
					var now = Date.now();
					var dt = (now - self.lastTime) / 1000;
					self.lastTime = now;

					// ランタイム統計更新
					app.Runtime.currentFrame++;
					app.Runtime.elapsedTime += dt;

					// 物理演算フローの更新 (Pulse)
					if (app.Bridge) app.Bridge.sync(dt);
					if (app.PulseFlow) app.PulseFlow.update();
				}
				requestAnimationFrame(loop);
			};
			requestAnimationFrame(loop);
		}
	};

})(SOPHIA);