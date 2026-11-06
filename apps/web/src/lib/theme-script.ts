// Runs in <head> before the first paint, so the saved theme and accent are on <html> when the page is first drawn.
// Without it the server HTML says dark and the effect in providers.tsx corrects it after hydration,
// which shows a dark flash to anyone using the light theme.
// It reads the same localStorage entry as the UI store (name devos-ui, see stores/ui.store.ts).
// Written as a plain string because it must run before any bundle loads; keep it free of build-time syntax.
export const THEME_STORAGE_KEY = 'devos-ui'

export const THEME_SCRIPT = `(function(){try{
var raw=localStorage.getItem('${THEME_STORAGE_KEY}');
var state=raw?JSON.parse(raw).state:null;
if(!state)return;
var root=document.documentElement;
var theme=state.theme;
if(theme==='system')theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
if(theme==='dark'||theme==='light')root.setAttribute('data-theme',theme);
if(typeof state.accentColor==='string'&&/^[a-z]{1,20}$/.test(state.accentColor))root.setAttribute('data-accent',state.accentColor);
}catch(e){}})();`
