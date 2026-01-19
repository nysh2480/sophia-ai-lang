/*
	File: sophia_parser.js
	Role: Sophia v1.7.2 構文解析器
*/
var SOPHIA = SOPHIA || {};

(function(app){
	"use strict";

	app.Parser = {
		tokens: [],
		pos: 0,

		parse: function(tokens) {
			this.tokens = tokens;
			this.pos = 0;
			var ast = { type: "Program", body: [] };
			while (!this.isEOF()) {
				var node = this.parseDefinition();
				if (node) {
					ast.body.push(node);
				} else {
					this.pos++;
				}
			}
			return ast;
		},

		peek: function() {
			return this.tokens[this.pos];
		},

		isEOF: function() {
			var t = this.peek();
			return !t || t.type === "EOF";
		},

		consume: function() {
			return this.tokens[this.pos++];
		},

		parseDefinition: function() {
			var t = this.peek();
			if (!t) return null;

			if (t.type === "NATURE") {
				if (t.value === "#") return this.parseSchemaDef();
			}
			if (t.type === "IDENT" && t.value === "scene") return this.parseSceneDef();
			return null;
		},

		parseSceneDef: function() {
			this.consume(); // scene
			var nameToken = this.consume();
			var name = nameToken ? nameToken.value : "Unknown";
			var lensToken = this.consume();
			var lens = lensToken ? lensToken.value : "|>"; 
			
			return {
				type: "SceneDefinition",
				name: name,
				lens: lens,
				body: this.parseBodyBlock()
			};
		},

		parseSchemaDef: function() {
			this.consume(); // #
			var nameToken = this.consume();
			var name = nameToken ? nameToken.value : "Unknown";
			var fields = [];
			this.consume(); // [
			while (this.peek() && this.peek().value !== "]") {
				var fName = this.consume().value;
				if (this.peek() && this.peek().value === ":") this.consume(); 
				var fType = (this.peek() && this.peek().type === "IDENT") ? this.consume().value : "any";
				fields.push({ name: fName, type: fType });
				if (this.peek() && this.peek().value === ",") this.consume();
			}
			if (this.peek() && this.peek().value === "]") this.consume();
			return { type: "SchemaDefinition", name: name, fields: fields };
		},

		parseBodyBlock: function() {
			var prefix = null;
			var t = this.peek();
			if (t && (t.value === "!" || t.value === "&")) {
				prefix = this.consume().value;
			}
			if (this.peek() && this.peek().value === "[") this.consume();
			
			var statements = [];
			while (this.peek() && this.peek().value !== "]") {
				var s = this.parseStatement();
				if (s) statements.push(s);
				else break;
			}
			if (this.peek() && this.peek().value === "]") this.consume();
			
			return { type: "BodyBlock", prefix: prefix, statements: statements };
		},

		parseStatement: function() {
			var t = this.peek();
			if (!t) return null;
			if (t.type === "NATURE") return this.parseActionOrReference();
			if (t.value === "?") return this.parseQAChain();
			return { type: "Expression", value: this.consume().value };
		},

		/* sophia_parser.js: parseActionOrReference 関数を完全に差し替え */

	parseActionOrReference : function() {
		var nature = this.consume().value;
		var ident = this.consume().value;
		var node = { type: "LValue", nature: nature, ident: ident };
		
		if (this.peek() && this.peek().value === "[") {
			this.consume(); // [ を消費
			var opToken = this.consume();
			var op = opToken ? opToken.value : "";
			
			// 【重要】 ] が来るまで、中身をすべて「値」として結合する
			var valParts = [];
			while (this.peek() && this.peek().value !== "]") {
				valParts.push(this.consume().value);
			}
			var val = valParts.join(" "); // 空白で結合して一つの式にする

			if (this.peek() && this.peek().value === "]") {
				this.consume(); // ] を消費
			}
			
			return { type: "Action", target: node, op: op, value: val };
		}
		return node;
	},

		parseQAChain: function() {
			this.consume(); // ?
			if (this.peek() && this.peek().value === "[") this.consume();
			var cond = "";
			while (this.peek() && this.peek().value !== "]") {
				cond += this.consume().value + " ";
			}
			if (this.peek() && this.peek().value === "]") this.consume();
			var body = this.parseBodyBlock();
			return { type: "QAChain", condition: cond.trim(), body: body };
		}
	};

})(SOPHIA);