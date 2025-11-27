export function getActiveProjectId() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const fromUrl = urlParams.get("projectId");
        if (fromUrl) return fromUrl;
    } catch (e) {}
    return localStorage.getItem('cabpoe.activeProjectId') || null;
}

export function setActiveProjectId(id) {
    if (!id) return;
    localStorage.setItem('cabpoe.activeProjectId', id);
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('projectId', id);
        window.history.replaceState({ path: url.href }, '', url.href);
    } catch (e) {}
}