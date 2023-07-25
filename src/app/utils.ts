export function sameDay(d1: Date, d2: Date) {    
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

export function now(): Date {
    // let d = new Date(2022, 7, 31, 0,31);
    // console.log('today is simulated:',d);
    // return d;
    return new Date();
}