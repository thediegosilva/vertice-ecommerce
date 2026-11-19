export const THEME_KEY = "vertice:theme";

/** Executado antes da pintura (inline no <head>) para evitar flash de tema errado. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d)r.classList.add("dark");r.classList.add("fx");}catch(e){document.documentElement.classList.add("fx")}})();`;
