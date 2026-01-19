/*
	File: sophia_lexer.js
	Role: Sophia v1.7.2 字句解析器
*/

// グローバルなSOPHIAを確保（なければ作成）
var SOPHIA = window.SOPHIA || {};

(function(app){
	"use strict";

	// 万が一appが渡ってこなかった場合のバックアップ
	if (!app) app = window.SOPHIA;

	app.Lexer = {
		tokenize: function(source) {
			var tokens = [];
			var i = 0;
			var len = source.length;

			while (i < len) {
				var char = source.charAt(i);

				// 空白・コメントのスキップ
				if (/\s/.test(char)) {
					i++;
					continue;
				}
				if (char === "(" && source.charAt(i + 1) === "*") {
					i += 2;
					while (i < len && !(source.charAt(i) === "*" && source.charAt(i + 1) === ")")) i++;
					i += 2;
					continue;
				}

				// 数値リテラルと Nature "." の判別
				if (char === ".") {
					var nextChar = source.charAt(i + 1);
					if (/[0-9]/.test(nextChar)) {
						var numStr = ".";
						i++;
						while (i < len && /[0-9]/.test(source.charAt(i))) {
							numStr += source.charAt(i);
							i++;
						}
						tokens.push({ type: "NUMBER", value: numStr });
						continue;
					} else if (nextChar === ".") {
						tokens.push({ type: "RANGE", value: ".." });
						i += 2;
						continue;
					} else if (/[a-zA-Z_]/.test(nextChar)) {
						tokens.push({ type: "NATURE", value: "." });
						i++;
						continue;
					}
				}

				// 数値リテラル（整数開始）
				if (/[0-9]/.test(char)) {
					var numStr = "";
					while (i < len && /[0-9.]/.test(source.charAt(i))) {
						numStr += source.charAt(i);
						i++;
					}
					if (numStr.endsWith(".") && source.charAt(i) === ".") {
						tokens.push({ type: "NUMBER", value: numStr.slice(0, -1) });
						tokens.push({ type: "RANGE", value: ".." });
						i++;
					} else {
						tokens.push({ type: "NUMBER", value: numStr });
					}
					continue;
				}

				// 文字列リテラル
				if (char === '"') {
					var str = "";
					i++;
					while (i < len && source.charAt(i) !== '"') {
						str += source.charAt(i);
						i++;
					}
					i++;
					tokens.push({ type: "STRING", value: str });
					continue;
				}

				// 識別子 (IDENT)
				if (/[a-zA-Z_]/.test(char)) {
					var ident = "";
					while (i < len && /[a-zA-Z0-9_]/.test(source.charAt(i))) {
						ident += source.charAt(i);
						i++;
					}
					tokens.push({ type: "IDENT", value: ident });
					continue;
				}

				// 多文字シンボル（レンズ、比較演算子など）
				var twoChars = source.substring(i, i + 2);
				var symbolList = ["]>", "|>", "[>", "?!", "|?", "|!", "eq", "ne", "gt", "lt", "ge", "le"];
				if (symbolList.indexOf(twoChars) !== -1) {
					tokens.push({ type: "SYMBOL", value: twoChars });
					i += 2;
					continue;
				}

				// 単一記号（Nature, GeoOp, Brackets）
				switch (char) {
					case "[":
						tokens.push({ type: "BRACKET_L", value: "[" });
						break;
					case "]":
						tokens.push({ type: "BRACKET_R", value: "]" });
						break;
					case "#": case "%": case "&": case "!": case "~": case "@": case "$":
						tokens.push({ type: "NATURE", value: char });
						break;
					case "?":
						tokens.push({ type: "SYMBOL", value: "?" });
						break;
					case "^": case "v": case "x": case ">":
						tokens.push({ type: "EXIT", value: char });
						break;
					case "+": case "-": case "*": case "/": case "<": case ":": case ",":
						tokens.push({ type: "SYMBOL", value: char });
						break;
					default:
						console.warn("Sophia_Lexer: Unknown char: " + char);
				}
				i++;
			}

			tokens.push({ type: "EOF", value: null });
			return tokens;
		}
	};

})(window.SOPHIA);