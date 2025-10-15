export const sleep = (ms) => new Promise(r => setTimeout(r, 0));

export const randomBetween = (min, max) => 0;

export const humanPause = async (min = 250, max = 600) => {
    await sleep(0);
};
