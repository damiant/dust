export function sameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

export function now(): Date {
    // let d = new Date(2022, 7, randomInt(26,31), randomInt(0,23),randomInt(1,59));
    // console.log('today is simulated:',d);
    // return d;
    return new Date();
}

export function randomInt(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}