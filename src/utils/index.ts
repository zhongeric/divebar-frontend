import { BigNumber } from "ethers";

export const getTimeUntil = (end: BigNumber) => {
    const now = new Date().getTime();
    const diff = end.toNumber() - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
        days,
        hours,
        minutes,
        seconds,
    };
};

export const getFormattedGameTimer = ({ days, hours, minutes, seconds }: {days: string, hours: string, minutes: string, seconds: string}, milliseconds: number) => {
    const daysString = Number(days) > 0 ? `${Number(days)} days ` : "";
    const hoursString = Number(hours) > 0 ? `${Number(hours)} hours ` : "";
    const minutesString = Number(minutes) > 0 ? `${Number(minutes)} minutes ` : "";
    const secondsString = Number(seconds) > 0 ? `${Number(seconds)}.${milliseconds} seconds ` : "";
    return `${daysString}${hoursString}${minutesString}${secondsString}` ? `${daysString}${hoursString}${minutesString}${secondsString}` : "The game has ended.";
}