/*
	File: sophia_transpiler.js
	Role: Sophia v1.7.2 厳密トランスパイラ
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
			if (!ast || !ast.body) return "";
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
			var statements = node.body.statements;
			for (i = 0; i < statements.length; i++) {
				code += "	" + this.visit(statements[i]) + "\n";
			}
			code += "});";
			return code;
		},

		// Nature参照 (~hp 等) の置換のみを行う
		_replaceRefs: function(str) {
			if (typeof str !== "string") return str;
			return str.replace(/([\~#@$%\.])\s*([a-zA-Z0-9_]+)/g, "app.NaturePool.get('$1', '$2')");
		},

		emitAction: function(node) {
			var nat = node.target.nature;
			var key = node.target.ident;
			var val = node.value;
			var op = node.op;

			// 1. 値のNature参照を置換
			val = app.Transpiler._replaceRefs(val);

			// 2. 演算子の厳密な変換
			// ユーザーが意図しない生テキストを書いた場合、JSはここで例外を出す。
			// トランスパイラ側で勝手に引用符を足すことはしない。
			var jsLine = "";
			var current = "app.NaturePool.get('" + nat + "', '" + key + "')";

			switch (op) {
				case "<": // 単純代入
					jsLine = "app.NaturePool.set('" + nat + "', '" + key + "', " + val + ");";
					break;
				case "v": // 加算
					jsLine = "app.NaturePool.set('" + nat + "', '" + key + "', " + current + " + " + val + ");";
					break;
				case "^": // 減算
					jsLine = "app.NaturePool.set('" + nat + "', '" + key + "', " + current + " - " + val + ");";
					break;
				case "x": // 削除
					jsLine = "app.NaturePool.set('" + nat + "', '" + key + "', null);";
					break;
				default:
					// 未定義の演算子（! など）が来た場合はそのままJSに出力し、
					// ブラウザの構文エラー（SyntaxError）として開発者に知らせる。
					jsLine = "app.NaturePool.set('" + nat + "', '" + key + "', " + current + " " + op + " " + val + ");";
					break;
			}
			return jsLine;
		},

		emitQA: function(node) {
			var cond = node.condition;
			var opMap = { "gt": ">", "lt": "<", "eq": "===", "ne": "!==", "ge": ">=", "le": "<=" };
			
			Object.keys(opMap).forEach(function(key) {
				var reg = new RegExp("\\b" + key + "\\b", "g");
				cond = cond.replace(reg, opMap[key]);
			});

			cond = app.Transpiler._replaceRefs(cond);

			var code = "if (" + cond + ") {\n";
			var i = 0;
			var stmts = node.body.statements;
			for (i = 0; i < stmts.length; i++) {
				code += "	" + this.visit(stmts[i]) + "\n";
			}
			code += "}";
			return code;
		}
	};

})(window.SOPHIA);