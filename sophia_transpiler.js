/*
	File: sophia_transpiler.js
	Role: Sophia v1.7.2 コード変換器 (演算子置換強化版)
*/
var SOPHIA = window.SOPHIA || {};

(function(app){
	"use strict";

	app.Transpiler = {
		compile: function(source) {
			var tokens = app.Lexer.tokenize(source);
			var ast = app.Parser.parse(tokens);
			return this.generate(ast);
		},

		generate: function(ast) {
			var buffer = [];
			var i = 0;
			for (i = 0; i < ast.body.length; i++) {
				buffer.push(this.visit(ast.body[i]));
			}
			return buffer.join("\n");
		},

		visit: function(node) {
			if (!node) return "";
			switch (node.type) {
				case "SchemaDefinition":
					return "app.NaturePool.defineSchema('" + node.name + "', " + JSON.stringify(node.fields) + ");";
				case "SceneDefinition":
					return this.emitScene(node);
				case "Action":
					return this.emitAction(node);
				case "QAChain":
					return this.emitQA(node);
				default:
					return "";
			}
		},

		emitScene: function(node) {
			var code = "app.Main.register_scene('" + node.name + "', function(ctx) {\n";
			code += "	ctx.lens = '" + node.lens + "';\n";
			var i = 0;
			for (i = 0; i < node.body.statements.length; i++) {
				code += "	" + this.visit(node.body.statements[i]) + "\n";
			}
			code += "});";
			return code;
		},

		emitAction: function(node) {
			var nat = node.target.nature;
			var key = node.target.ident;
			var val = node.value;

			// 値の中にNature参照や文字列リテラルが含まれる場合の処理
			if (typeof val === "string") {
				// Nature参照の置換
				val = val.replace(/([\~#@$%\.])([a-zA-Z0-9_]+)/g, "app.NaturePool.get('$1', '$2')");
				// Sophiaの ! (文字列結合/出力) の簡易対応
				if (val.indexOf("!") !== -1) {
					var parts = val.split("!");
					val = parts[parts.length - 1].trim();
					if (!val.startsWith('"')) val = '"' + val + '"';
				}
			}

			if (node.op === "<") {
				return "app.NaturePool.set('" + nat + "', '" + key + "', " + val + ");";
			} else if (node.op === "x") {
				return "app.NaturePool.set('" + nat + "', '" + key + "', null);";
			} else {
				var current = "app.NaturePool.get('" + nat + "', '" + key + "')";
				return "app.NaturePool.set('" + nat + "', '" + key + "', " + current + " " + node.op + " " + val + ");";
			}
		},

		emitQA: function(node) {
			var cond = node.condition;

			// 1. Sophia演算子 (gt, lt, eq, ne, ge, le) を JS演算子に変換
			var opMap = {
				"gt": ">",
				"lt": "<",
				"eq": "===",
				"ne": "!==",
				"ge": ">=",
				"le": "<="
			};
			
			Object.keys(opMap).forEach(function(key) {
				var reg = new RegExp("\\s" + key + "\\s", "g");
				cond = cond.replace(reg, " " + opMap[key] + " ");
			});

			// 2. Nature参照 (~hp 等) を app.NaturePool.get に置換
			cond = cond.replace(/([\~#@$%\.])([a-zA-Z0-9_]+)/g, "app.NaturePool.get('$1', '$2')");

			var code = "if (" + cond + ") {\n";
			var i = 0;
			for (i = 0; i < node.body.statements.length; i++) {
				code += "	" + this.visit(node.body.statements[i]) + "\n";
			}
			code += "}";
			return code;
		}
	};

})(window.SOPHIA);