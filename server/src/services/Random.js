
/**
 * Class Random for working with random values
 */
class Random {
    /**
     * Generation of random integer value in range [min, max)
     * @param {number} min - min value of range
     * @param {number} max - min value of range
     * @returns random integer value in range [min, max)
     */
    static getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    /**
     * Generation of random double value in range [min, max)
     * @param {number} min - min value of range
     * @param {number} max - min value of range
     * @returns random double value in range [min, max)
     */
    static getRandomDouble(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Shuffle elements in array
     * @param {Array} array - array
     * @returns Shuffled array
     */
    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

module.exports = Random;