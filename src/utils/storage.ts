const setStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
}
const getStorage = (key: string) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}
export {
    setStorage,
    getStorage,
}