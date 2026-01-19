/*
	File: sophia_transpiler.js
	Role: Sophia v1.7.2 コード変換器 (Nature対応版)
*/
var SOPHIA = SOPHIA || {};

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
			for (var i = 0; i < ast.body.length; i++) {
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
			for (var i = 0; i < node.body.statements.length; i++) {
				code += "	" + this.visit(node.body.statements[i]) + "\n";
			}
			code += "});";
			return code;
		},


	emitAction : function(node) {
		var nat = node.target.nature;
		var key = node.target.ident;
		var val = node.value;

		// 値の中にNature参照 (~ # @ $ % .) がある場合に置換
		if (typeof val === "string") {
			val = val.replace(/([\~#@$%\.])([a-zA-Z0-9_]+)/g, "app.NaturePool.get('$1', '$2')");
		}

		// 物理演算 [ GeoOp ] の展開
		if (node.op === "<") {
			// 代入: app.NaturePool.set(nature, key, value)
			return "app.NaturePool.set('" + nat + "', '" + key + "', " + val + ");";
		} else if (node.op === "x") {
			// 削除: app.NaturePool.remove(nature, key)
			return "app.NaturePool.remove('" + nat + "', '" + key + "');";
		} else {
			// 算術演算 (+=, -= 等)
			var current = "app.NaturePool.get('" + nat + "', '" + key + "')";
			return "app.NaturePool.set('" + nat + "', '" + key + "', " + current + " " + node.op + " " + val + ");";
		}
	},

		emitQA: function(node) {
			var cond = node.condition;
			// 自然記号 (~ # @ $ % .) をキャッチするように修正
			cond = cond.replace(/([\~#@$%\.])([a-zA-Z0-9_]+)/g, "app.NaturePool.get('$1', '$2')");

			var code = "if (" + cond + ") {\n";
			for (var i = 0; i < node.body.statements.length; i++) {
				code += "	" + this.visit(node.body.statements[i]) + "\n";
			}
			code += "}";
			return code;
		}
	};

})(SOPHIA);