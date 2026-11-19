export const THEME_KEY = "vertice:theme";

/**
 * Executado antes da pintura (inline no <head>):
 * 1) aplica o tema salvo (evita flash de tema errado);
 * 2) remove o que o Netlify injeta no <head> de sites *.netlify.app: um comentário
 *    promocional precedido de quebra de linha. Esses nós (comentário + texto em branco)
 *    não vêm do React e quebravam a hidratação (React error #418).
 *    O <head> gerado pelo Next nunca tem nós de texto soltos nem comentários próprios.
 */
export const themeScript = `(function(){var r=document.documentElement;try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)r.classList.add("dark");}catch(e){}r.classList.add("fx");try{var h=document.head;if(h){for(var n=h.firstChild;n;){var x=n.nextSibling;if((n.nodeType===8&&/netlify/i.test(n.data))||(n.nodeType===3&&!/\\S/.test(n.data)))h.removeChild(n);n=x;}}}catch(e){}})();`;
